
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes.
 * - generateDishConcept: Génère un concept complet de plat (recette + image) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DishConceptInputSchema = z.object({
    dishName: z.string().describe("Le nom ou l'idée de base du plat."),
    mainIngredients: z.string().describe("Les ingrédients principaux à intégrer obligatoirement."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style, la saisonnalité, ou le type de cuisine souhaité."),
});
export type DishConceptInput = z.infer<typeof DishConceptInputSchema>;

const DishConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final et marketing du plat."),
    description: z.string().describe("Une description alléchante et créative du plat."),
    ingredients: z.array(z.string()).describe("La liste des ingrédients nécessaires pour la recette."),
    procedure: z.string().describe("Les étapes détaillées de la préparation et de la cuisson."),
    plating: z.string().describe("Les instructions pour un dressage artistique et professionnel du plat."),
    imageUrl: z.string().url().describe("L'URL d'une image générée représentant le plat final."),
});
export type DishConceptOutput = z.infer<typeof DishConceptOutputSchema>;


// Fonction exportée principale
export async function generateDishConcept(input: DishConceptInput): Promise<DishConceptOutput> {
    return generateDishConceptFlow(input);
}


// Définition du prompt pour la génération de la recette textuelle
const recipeConceptPrompt = ai.definePrompt({
    name: 'recipeConceptPrompt',
    input: { schema: DishConceptInputSchema },
    output: { schema: Omit(DishConceptOutputSchema.shape, ['imageUrl']) }, // On exclut l'URL de l'image ici
    prompt: `
        Vous êtes un chef cuisinier créatif et un styliste culinaire de renommée mondiale, travaillant pour un restaurant gastronomique.
        Votre mission est de transformer une idée brute en un concept de plat complet, professionnel et inspirant.

        Voici les instructions du chef de l'établissement :
        - Nom de l'idée : {{{dishName}}}
        - Ingrédients à utiliser : {{{mainIngredients}}}
        {{#if excludedIngredients}}- Ingrédients à **ABSOLUMENT EXCLURE** : {{{excludedIngredients}}}{{/if}}
        {{#if recommendations}}- Recommandations et style : {{{recommendations}}}{{/if}}

        Votre tâche est de générer les éléments suivants :
        1.  **name**: Un nom de plat final, élégant et marketing.
        2.  **description**: Une description courte, poétique et alléchante qui met l'eau à la bouche.
        3.  **ingredients**: Une liste simple des ingrédients nécessaires. Ne mettez pas les quantités, juste les noms.
        4.  **procedure**: Une procédure claire et concise, comme si vous l'écriviez pour votre brigade.
        5.  **plating**: Des instructions de dressage précises pour créer une assiette visuellement spectaculaire, digne d'un grand restaurant.

        Soyez créatif, audacieux et respectez les contraintes à la lettre.
    `,
});

// Le flow principal qui orchestre la génération de texte et d'image
const generateDishConceptFlow = ai.defineFlow(
    {
        name: 'generateDishConceptFlow',
        inputSchema: DishConceptInputSchema,
        outputSchema: DishConceptOutputSchema,
    },
    async (input) => {
        // 1. Générer le concept textuel de la recette
        const { output: recipeConcept } = await recipeConceptPrompt(input);

        if (!recipeConcept) {
            throw new Error("La génération du concept de la recette a échoué.");
        }

        // 2. Créer un prompt pour l'image basé sur la recette générée
        const imagePrompt = `
            Photographie culinaire professionnelle et ultra-réaliste, style magazine gastronomique.
            Plat : "${recipeConcept.name}".
            Description : "${recipeConcept.description}".
            Dressage : "${recipeConcept.plating}".
            L'assiette est dressée de manière artistique sur une table élégante. Éclairage de studio, faible profondeur de champ, détails nets et couleurs vibrantes.
        `;

        // 3. Générer l'image
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001',
            prompt: imagePrompt,
        });
        
        if (!media || !media.url) {
            throw new Error("La génération de l'image a échoué.");
        }

        // 4. Combiner le texte et l'image dans la sortie finale
        return {
            ...recipeConcept,
            imageUrl: media.url,
        };
    }
);
