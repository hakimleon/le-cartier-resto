
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes.
 * - generateDishConcept: Génère un concept complet de plat (recette + image) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DishConceptInputSchema = z.object({
    dishName: z.string().optional().describe("Le nom ou l'idée de base du plat. Peut être vide."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style, la saisonnalité, ou le type de cuisine souhaité."),
});
export type DishConceptInput = z.infer<typeof DishConceptInputSchema>;

const DishConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final et marketing du plat."),
    description: z.string().describe("Une description alléchante et créative du plat."),
    ingredients: z.array(z.string()).describe("La liste des ingrédients nécessaires pour la recette."),
    subRecipes: z.array(z.string()).describe("La liste des sous-recettes ou préparations nécessaires (ex: 'Sauce Vierge', 'Fond de veau')."),
    procedure_preparation: z.string().describe("Les étapes détaillées de la phase de préparation (mise en place)."),
    procedure_cuisson: z.string().describe("Les étapes détaillées de la phase de cuisson."),
    procedure_service: z.string().describe("Les étapes détaillées pour le service et le dressage artistique."),
    duration: z.number().int().describe("La durée totale de préparation en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Le niveau de difficulté de la recette."),
    portions: z.number().int().describe("Le nombre de portions que la recette produit."),
    commercialArgument: z.string().describe("Un argumentaire commercial court et percutant pour le plat."),
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
    output: { schema: DishConceptOutputSchema.omit({ imageUrl: true }) },
    prompt: `
        Vous êtes un chef cuisinier créatif et un styliste culinaire de renommée mondiale, chargé de créer une fiche technique quasi-complète pour un nouveau plat.
        Votre mission est de transformer une idée brute en un concept de plat professionnel, inspirant et structuré.

        Voici les instructions du chef de l'établissement :
        {{#if dishName}}- Le nom du plat est imposé : {{{dishName}}}. Vous devez le conserver.{{else}}- Vous avez carte blanche pour inventer un nom de plat créatif et alléchant.{{/if}}
        {{#if mainIngredients}}- Ingrédients à utiliser : {{{mainIngredients}}}{{else}}- Ingrédients principaux: Vous avez carte blanche pour les choisir. Soyez créatif.{{/if}}
        {{#if excludedIngredients}}- Ingrédients à **ABSOLUMENT EXCLURE** : {{{excludedIngredients}}}{{/if}}
        {{#if recommendations}}- Recommandations et style : {{{recommendations}}}{{/if}}

        Votre tâche est de générer une fiche technique détaillée avec les éléments suivants :
        1.  **name**: {{#if dishName}}Conservez impérativement le nom "{{{dishName}}}".{{else}}Inventez un nom marketing et séduisant pour le plat.{{/if}}
        2.  **description**: Une description courte, poétique et alléchante qui met l'eau à la bouche.
        3.  **ingredients**: Une liste simple des ingrédients bruts nécessaires. Ne mettez pas les quantités, juste les noms.
        4.  **subRecipes**: Déduisez de la recette que vous créez la liste des préparations ou sous-recettes qui devront être réalisées à l'avance (ex: "Fond de veau", "Sauce vierge", "Purée de carottes", "Vinaigrette balsamique"). Si aucune n'est évidente, retournez un tableau vide.
        5.  **procedure_preparation**: Les étapes claires pour la mise en place et la préparation des composants.
        6.  **procedure_cuisson**: Les étapes techniques pour la cuisson. Si le plat est cru, indiquez "Aucune cuisson nécessaire.".
        7.  **procedure_service**: Les instructions de dressage précises pour créer une assiette visuellement spectaculaire.
        8.  **duration**: Estimez la durée totale de préparation en minutes (nombre entier).
        9.  **difficulty**: Évaluez la difficulté de la recette ('Facile', 'Moyen', 'Difficile').
        10. **portions**: Estimez le nombre de portions que cette recette produit (ex: 1, 2, 4...).
        11. **commercialArgument**: Rédigez un argumentaire de vente court, percutant et savoureux pour convaincre un client de choisir ce plat.

        Soyez créatif, audacieux et respectez les contraintes à la lettre. Fournissez une réponse structurée au format JSON.
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

        let imageUrl = "https://picsum.photos/1024/768"; // Image de substitution par défaut

        try {
            // 2. Créer un prompt pour l'image basé sur la recette générée
            const imagePrompt = `
                Photographie culinaire professionnelle et ultra-réaliste, style magazine gastronomique.
                Plat : "${recipeConcept.name}".
                Description : "${recipeConcept.description}".
                Dressage : "${recipeConcept.procedure_service}".
                L'assiette est dressée de manière artistique sur une table élégante. Éclairage de studio, faible profondeur de champ, détails nets et couleurs vibrantes.
            `;

            // 3. Essayer de générer l'image avec le modèle approprié
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.5-flash-image-preview',
                prompt: imagePrompt,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                }
            });
            
            if (media && media.url) {
                imageUrl = media.url;
            } else {
                console.warn("La génération de l'image a retourné une réponse vide, utilisation de l'image de substitution.");
            }
        } catch (error) {
            // Si la génération d'image échoue (quota, etc.), on log l'erreur mais on ne bloque pas le processus.
            console.error("Erreur lors de la génération de l'image, utilisation de l'image de substitution.", error);
        }


        // 4. Combiner le texte et l'image (réelle ou de substitution) dans la sortie finale
        return {
            ...recipeConcept,
            imageUrl: imageUrl,
        };
    }
);
