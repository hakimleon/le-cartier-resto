
'use server';
/**
 * @fileOverview Flow pour la génération de contenu par IA.
 *
 * - generateRecipe - Génère une recette complète (ingrédients, procédure, etc.)
 * - generateCommercialArgument - Génère un argumentaire commercial pour un plat.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GeneratedIngredient } from '@/lib/types';

// Schéma d'entrée pour la génération de l'argumentaire
const CommercialArgumentInputSchema = z.object({
  name: z.string().describe('Le nom du plat.'),
  description: z.string().describe('La description du plat.'),
  ingredients: z.array(z.string()).describe('La liste des ingrédients principaux.'),
});
export type CommercialArgumentInput = z.infer<typeof CommercialArgumentInputSchema>;

// Schéma de sortie pour l'argumentaire
const CommercialArgumentOutputSchema = z.object({
  argument: z.string().describe("L'argumentaire commercial généré."),
});
export type CommercialArgumentOutput = z.infer<typeof CommercialArgumentOutputSchema>;


// Fonction exportée pour générer l'argumentaire
export async function generateCommercialArgument(input: CommercialArgumentInput): Promise<CommercialArgumentOutput> {
  return commercialArgumentFlow(input);
}


// Définition du flow pour l'argumentaire commercial
const commercialArgumentFlow = ai.defineFlow(
  {
    name: 'commercialArgumentFlow',
    inputSchema: CommercialArgumentInputSchema,
    outputSchema: CommercialArgumentOutputSchema,
  },
  async (input) => {
    const prompt = `
        Vous êtes un expert en marketing culinaire pour un restaurant bistronomique.
        Votre tâche est de rédiger un argumentaire commercial court, percutant et alléchant pour le plat suivant.
        Mettez en avant la qualité des produits et l'aspect savoureux du plat.

        Nom du plat: ${input.name}
        Description: ${input.description}
        Ingrédients clés: ${input.ingredients.join(', ')}

        Rédigez l'argumentaire.
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
          schema: CommercialArgumentOutputSchema
      }
    });

    return output!;
  }
);


// Schéma d'entrée pour la génération de recette
const RecipeInputSchema = z.object({
  name: z.string().describe('Le nom de la recette (plat ou préparation).'),
  description: z.string().describe('Une courte description de ce que c\'est.'),
  type: z.enum(['Plat', 'Préparation']).describe('Le type de fiche technique à générer.'),
});
export type RecipeInput = z.infer<typeof RecipeInputSchema>;


// Schéma de sortie pour la génération de recette
const RecipeOutputSchema = z.object({
    ingredients: z.array(z.object({
        name: z.string().describe("Le nom de l'ingrédient."),
        quantity: z.number().describe("La quantité nécessaire."),
        unit: z.string().describe("L'unité de mesure (ex: g, kg, ml, l, pièce).")
    })).describe("La liste des ingrédients pour la recette."),
    procedure_preparation: z.string().describe("Les étapes détaillées de la phase de préparation."),
    procedure_cuisson: z.string().describe("Les étapes détaillées de la phase de cuisson."),
    procedure_service: z.string().describe("Les étapes détaillées pour le service ou le dressage."),
    duration: z.number().int().positive().describe("La durée totale de préparation en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Le niveau de difficulté de la recette."),
});
export type RecipeOutput = z.infer<typeof RecipeOutputSchema>;


// Fonction exportée pour générer une recette
export async function generateRecipe(input: RecipeInput): Promise<RecipeOutput> {
    return generateRecipeFlow(input);
}


// Définition du prompt pour la génération de recette
const recipeGenerationPrompt = ai.definePrompt({
    name: 'recipeGenerationPrompt',
    input: { schema: RecipeInputSchema },
    output: { schema: RecipeOutputSchema },
    prompt: `
        Vous êtes un chef de cuisine expérimenté spécialisé dans la création de fiches techniques pour la restauration bistronomique.
        Votre mission est de créer une fiche technique détaillée pour la demande suivante.

        Nom: {{{name}}}
        Description: {{{description}}}
        Type de Fiche: {{{type}}}

        Instructions:
        1.  Listez les ingrédients nécessaires avec des quantités et des unités réalistes pour un contexte de restaurant.
        2.  Rédigez une procédure claire et concise, séparée en trois étapes distinctes : "Préparation", "Cuisson", et "Service". Si une étape n'est pas pertinente (ex: pas de cuisson pour une vinaigrette), laissez-la vide.
        3.  Estimez la durée totale de préparation en minutes.
        4.  Évaluez la difficulté de la recette (Facile, Moyen, Difficile).
        5.  Fournissez la sortie au format JSON structuré attendu.
    `,
});

// Définition du flow pour la génération de recette
const generateRecipeFlow = ai.defineFlow({
    name: 'generateRecipeFlow',
    inputSchema: RecipeInputSchema,
    outputSchema: RecipeOutputSchema,
}, async (input) => {
    const { output } = await recipeGenerationPrompt(input);
    return output!;
});
