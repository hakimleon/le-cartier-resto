
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
    output: { schema: RecipeOutputSchema },
    prompt: `
        Vous êtes un chef de cuisine expert spécialisé dans les cuisines gastronomiques française, algérienne, italienne et méditerranéenne. 
        Votre mission est de créer une fiche technique détaillée et professionnelle pour des restaurants, en vous basant sur la recette classique et fondamentale universellement reconnue pour le nom fourni. N'inventez pas de variations non pertinentes.

        Nom: {{{name}}}
        Description: {{{description}}}
        Type de Fiche: {{{type}}}

        Instructions:
        1.  Listez les ingrédients nécessaires avec des quantités précises (en grammes, litres, unités) et une qualité attendue pour un restaurant (ex: "beurre").
        2.  Rédigez une procédure technique et détaillée en trois phases : "Préparation" (mise en place, techniques), "Cuisson" (températures, temps), et "Service" (dressage). Si une étape n'est pas applicable (ex: pas de cuisson), retournez une chaîne de caractères vide pour ce champ spécifique.
        3.  Estimez la durée totale de la recette en minutes.
        4.  Évaluez la difficulté (Facile, Moyen, Difficile).
        5.  Déduisez et fournissez la quantité totale que la recette produite (productionQuantity), son unité (productionUnit), et l'unité d'utilisation suggérée (usageUnit). Par exemple, une sauce peut produire 1 litre (production) et être utilisée en grammes (usage).
        6.  Assurez-vous que la recette soit réalisable, gustativement équilibrée et respecte les standards de la cuisine demandée.
        7.  Fournissez la sortie au format JSON structuré attendu.
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
