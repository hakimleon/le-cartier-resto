
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes (plats et préparations).
 * - generateRecipeConcept: Génère un concept complet (recette + image si plat) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const RecipeConceptInputSchema = z.object({
    type: z.enum(['Plat', 'Préparation']).describe('Le type de fiche technique à générer.'),
    name: z.string().describe("Le nom ou l'idée de base du plat/préparation."),
    description: z.string().optional().describe("La description du plat/préparation."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style, la saisonnalité, ou le type de cuisine souhaité."),
    rawRecipe: z.string().optional().describe("Une recette complète en texte brut à reformater. Si ce champ est fourni, l'IA doit l'utiliser comme source principale."),
    refinementHistory: z.array(z.string()).optional().describe("L'historique des instructions d'affinage précédentes."),
    currentRefinement: z.string().optional().describe("La nouvelle instruction d'affinage à appliquer."),
});
export type RecipeConceptInput = z.infer<typeof RecipeConceptInputSchema>;

const RecipeConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final et marketing de la recette."),
    description: z.string().describe("Une description alléchante et créative."),
    
    // Champs pour les deux types
    ingredients: z.array(z.object({
        name: z.string().describe("Nom de l'ingrédient."),
        quantity: z.number().describe("Quantité."),
        unit: z.string().describe("Unité (g, kg, ml, l, pièce).")
    })).describe("Liste des ingrédients SIMPLES."),
    subRecipes: z.array(z.object({
        name: z.string().describe("Nom de la sous-recette EXISTANTE."),
        quantity: z.number().describe("Quantité de sous-recette."),
        unit: z.string().describe("Unité pour la sous-recette."),
    })).describe("Liste des sous-recettes EXISTANTES utilisées."),
    newSubRecipes: z.array(z.object({
        name: z.string().describe("Nom de la NOUVELLE préparation inventée."),
        description: z.string().describe("Description de la nouvelle préparation."),
    })).describe("Liste des NOUVELLES préparations inventées."),
    procedure_preparation: z.string().describe("Procédure de préparation (Markdown)."),
    procedure_cuisson: z.string().describe("Procédure de cuisson (Markdown)."),
    procedure_service: z.string().describe("Procédure de service/dressage (Markdown)."),
    duration: z.number().int().describe("Durée totale en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Niveau de difficulté."),
    
    // Champs spécifiques au Plat
    category: z.enum(['Entrées froides et chaudes', 'Plats et Grillades', 'Les mets de chez nous', 'Symphonie de pâtes', 'Nos Burgers Bistronomiques', 'Dessert', 'Élixirs & Rafraîchissements']).optional().describe("Catégorie du plat, si applicable."),
    portions: z.number().int().optional().describe("Nombre de portions, si c'est un plat."),
    commercialArgument: z.string().optional().describe("Argumentaire commercial, si c'est un plat."),
    imageUrl: z.string().url().optional().describe("URL de l'image générée, si c'est un plat."),

    // Champs spécifiques à la Préparation
    productionQuantity: z.number().optional().describe("Quantité totale produite, si c'est une préparation."),
    productionUnit: z.string().optional().describe("Unité de production (kg, l, pièces), si c'est une préparation."),
    usageUnit: z.string().optional().describe("Unité d'utilisation suggérée (g, ml, pièce), si c'est une préparation."),
});
export type RecipeConceptOutput = z.infer<typeof RecipeConceptOutputSchema>;

// Schéma interne sans imageUrl pour le prompt de génération de texte
const RecipeTextConceptSchema = RecipeConceptOutputSchema.omit({ imageUrl: true });

const recipeGenPrompt = ai.definePrompt({
    name: 'recipeWorkshopPrompt',
    input: { schema: RecipeConceptInputSchema },
    output: { schema: RecipeTextConceptSchema },
    tools: [getAvailablePreparationsTool],
    model: 'googleai/gemini-2.5-flash',
    prompt: `
        Vous êtes un chef expert créant une fiche technique pour un restaurant. La cible est une fiche de type : {{{type}}}.

        OBLIGATOIRE : Utilisez l'outil \`getAvailablePreparations\` pour connaître les sous-recettes existantes.

        **RÈGLE D'OR : PRIORISER LES PRÉPARATIONS EXISTANTES.**
        Si un composant demandé (ex: "mayonnaise", "fond de veau") existe dans la liste de l'outil, vous devez l'utiliser dans \`subRecipes\` avec une quantité et une unité estimées. N'incluez PAS ses ingrédients dans la liste \`ingredients\`.

        **GESTION DES NOUVELLES SOUS-RECETTES (newSubRecipes) - RÈGLE CRUCIALE :**
        - Une préparation est "nouvelle" SEULEMENT si c'est une base complexe et réutilisable (ex: "Pâte brisée", "Confit d'oignons").
        - Les assemblages simples ou sauces "minute" (ex: "Vinaigrette pour salade", "Sauce crème-champignons") NE SONT PAS de nouvelles sous-recettes. Leurs ingrédients vont dans \`ingredients\` et leurs étapes dans la procédure principale.
        
        {{#if rawRecipe}}
        PRIORITÉ : Reformatez la recette brute suivante en respectant la structure demandée.
        ---
        {{{rawRecipe}}}
        ---
        {{else}}
        CRÉATION : Créez une nouvelle fiche technique.
        - Nom/Idée : {{{name}}}
        - Description: {{{description}}}
        - Ingrédients principaux : {{{mainIngredients}}}
        - À exclure : {{{excludedIngredients}}}
        - Recommandations : {{{recommendations}}}
        {{/if}}

        {{#if refinementHistory}}
        - HISTORIQUE DES DEMANDES (à respecter) :
        {{#each refinementHistory}}
            - "{{{this}}}"
        {{/each}}
        {{/if}}

        {{#if currentRefinement}}
        - NOUVELLE INSTRUCTION (à appliquer par-dessus tout) : "{{{currentRefinement}}}"
        {{/if}}

        **INSTRUCTIONS DE FORMATAGE**
        - **Pour un Plat :** Remplir les champs \`portions\`, \`category\`, \`commercialArgument\`.
        - **Pour une Préparation :** Remplir les champs \`productionQuantity\`, \`productionUnit\`, \`usageUnit\`.
        - **Toujours remplir :** \`name\`, \`description\`, \`ingredients\`, \`subRecipes\`, \`newSubRecipes\`, les 3 \`procedure_...\`, \`duration\`, \`difficulty\`.
        - **Unités :** Préférez g, kg, l, ml. Utilisez "pièce" seulement si indispensable.
        - **Procédures :** Formatées en Markdown (### Titres, - Listes).
        - **Sortie :** Fournissez une réponse structurée au format JSON. Ne laissez aucun champ vide, utilisez des tableaux vides '[]' ou des chaînes vides '""' si nécessaire.
    `,
});

export const generateRecipeConceptFlow = ai.defineFlow(
    {
        name: 'generateRecipeConceptFlow',
        inputSchema: RecipeConceptInputSchema,
        outputSchema: RecipeConceptOutputSchema,
    },
    async (input) => {
        // 1. Générer le concept textuel de la recette
        const { output: recipeConcept } = await recipeGenPrompt(input);

        if (!recipeConcept) {
            throw new Error("La génération du concept de la recette a échoué.");
        }
        
        let finalOutput: RecipeConceptOutput = { ...recipeConcept, imageUrl: undefined };

        // 2. Si c'est un plat, générer une image
        if (input.type === 'Plat') {
            let imageUrl = `https://placehold.co/1024x768/fafafa/7d7d7d.png?text=${encodeURIComponent(recipeConcept.name)}`;

            try {
                const imagePrompt = `Photographie culinaire professionnelle, style magazine gastronomique. Plat : "${recipeConcept.name}". Description : "${recipeConcept.description}". Dressage : "${recipeConcept.procedure_service}". Éclairage de studio, faible profondeur de champ.`;

                const { media } = await ai.generate({
                    model: 'googleai/imagen-4.0-fast-generate-001',
                    prompt: imagePrompt,
                });
                
                if (media?.url) {
                    const uploadResult = await cloudinary.uploader.upload(media.url, {
                        folder: "le-singulier-ai-generated",
                        resource_type: "image",
                    });
                    imageUrl = uploadResult.secure_url;
                }
            } catch (error) {
                console.error("Erreur de génération/téléversement d'image, utilisation du placeholder.", error);
            }
            finalOutput.imageUrl = imageUrl;
        }

        return finalOutput;
    }
);

// Fonction exportée principale
export async function generateRecipeConcept(input: RecipeConceptInput): Promise<RecipeConceptOutput> {
    return generateRecipeConceptFlow(input);
}
