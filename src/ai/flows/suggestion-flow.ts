
'use server';
/**
 * @fileOverview Flow pour la génération de contenu par IA.
 *
 * - generateRecipe - Génère une recette complète (ingrédients, procédure, etc.)
 * - generateCommercialArgument - Génère un argumentaire commercial pour un plat.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GeneratedIngredient, Preparation } from '@/lib/types';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';

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
        Vous êtes un expert en marketing culinaire pour un restaurant gastronomique et/ou bistronomique.
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
    })).describe("La liste des ingrédients SIMPLES pour la recette. NE PAS inclure de sous-recettes ici."),
    procedure_preparation: z.string().describe("Les étapes détaillées de la phase de préparation. DOIT être formaté en Markdown."),
    procedure_cuisson: z.string().describe("Les étapes détaillées de la phase de cuisson. DOIT être formaté en Markdown."),
    procedure_service: z.string().describe("Les étapes détaillées pour le service ou le dressage. DOIT être formaté en Markdown."),
    duration: z.number().int().describe("La durée totale de préparation en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Le niveau de difficulté de la recette."),
    productionQuantity: z.number().describe("La quantité totale que la recette produit."),
    productionUnit: z.string().describe("L'unité de la quantité produite (ex: kg, l, pièces)."),
    usageUnit: z.string().describe("L'unité suggérée pour l'utilisation de cette préparation dans d'autres recettes (ex: g, ml, pièce)."),
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
    output: { schema: RecipeOutputSchema.omit({ subRecipes: true, newSubRecipes: true } as any) }, // Simplify output
    prompt: `
        Vous êtes un chef de cuisine expert. Votre mission est de créer une fiche technique détaillée pour des restaurants.
        
        Nom: {{{name}}}
        Description: {{{description}}}
        Type de Fiche: {{{type}}}

        **Instructions FONDAMENTALES :**
        1.  **Règle sur les Ingrédients :** Listez UNIQUEMENT les ingrédients BRUTS et SIMPLES. Si la recette nécessite un composant complexe comme une "Mayonnaise" ou une "Sauce Tomate", listez simplement cet ingrédient par son nom (ex: "Mayonnaise", "Sauce Tomate"). Ne décomposez JAMAIS ces composants en leurs propres ingrédients (ne listez pas huile, oeuf, etc. pour une mayonnaise).
        2.  **Règle sur les noms :** Utilisez des noms d'ingrédients génériques (ex: "Tomate", "Oignon", "Poulet", "Mayonnaise").
        3.  **Règle sur les unités :** Privilégiez systématiquement les unités de poids (g, kg) et de volume (l, ml). Utilisez "pièce" uniquement quand c'est indispensable.
        4.  **Procédure :** Rédigez une procédure technique détaillée en trois phases : "Préparation", "Cuisson", et "Service", en format Markdown. Si une phase n'est pas applicable, retournez une chaîne vide. La procédure doit mentionner l'utilisation des composants complexes (ex: "Ajouter 100g de Mayonnaise").
        5.  **Estimations :** Estimez la durée, la difficulté, la quantité produite (et son unité), et l'unité d'utilisation.
        6.  **Sortie :** Fournissez la sortie au format JSON structuré attendu. Ne générez pas de champs 'subRecipes' ou 'newSubRecipes'.
    `,
});

// Définition du flow pour la génération de recette
const generateRecipeFlow = ai.defineFlow({
    name: 'generateRecipeFlow',
    inputSchema: RecipeInputSchema,
    outputSchema: RecipeOutputSchema,
}, async (input) => {
    
    const { output } = await recipeGenerationPrompt(input);

    if (!output) {
        throw new Error("La génération de la recette a échoué car la sortie de l'IA est vide.");
    }
    
    return output;
});
