
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
    subRecipes: z.array(z.string()).describe("La liste des noms des sous-recettes EXISTANTES (qui étaient dans la liste fournie par l'outil) utilisées dans ce plat."),
    newSubRecipes: z.array(z.object({
        name: z.string().describe("Le nom de la NOUVELLE préparation que l'IA a dû créer car elle n'était pas dans la liste des préparations existantes."),
        description: z.string().describe("Une courte description de ce qu'est cette nouvelle préparation."),
    })).describe("La liste des NOUVELLES préparations que l'IA a dû inventer pour cette recette."),
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
    output: { schema: RecipeOutputSchema },
    tools: [getAvailablePreparationsTool],
    prompt: `
        Vous êtes un chef de cuisine expert. Votre mission est de créer une fiche technique détaillée pour des restaurants.
        
        Nom: {{{name}}}
        Description: {{{description}}}
        Type de Fiche: {{{type}}}

        Pour déterminer quelles préparations de base peuvent être utilisées, vous devez OBLIGATOIREMENT utiliser l'outil \`getAvailablePreparations\`. La liste retournée par cet outil est la SEULE source de vérité des préparations existantes.

        **Règle d'or : PRIVILÉGIER LES PRÉPARATIONS EXISTANTES**
        Avant de lister les ingrédients, analysez la demande. Si un ingrédient demandé (ex: "mayonnaise", "sauce tomate", "fond de veau") correspond à une préparation existante dans la liste fournie par l'outil, vous devez **IMPÉRATIVEMENT** utiliser cette préparation dans le champ \`subRecipes\` au lieu de lister ses composants comme des ingrédients bruts. N'ajoutez PAS les ingrédients de la préparation existante (ex: huile, oeuf pour la mayonnaise) dans le champ \`ingredients\` du plat.

        **Règles de gestion des sous-recettes (préparations) - TRÈS IMPORTANT :**
        1.  Si une préparation nécessaire pour la recette existe dans la liste fournie par l'outil (cf. Règle d'or), vous devez l'ajouter au tableau \`subRecipes\`.
        2.  **Règle de discernement CRUCIALE et IMPÉRATIVE :** Une préparation ne doit être listée dans \`newSubRecipes\` que si elle représente une VRAIE préparation de base, complexe, qui a un intérêt à être stockée et réutilisée dans d'autres plats.
            -   **EXEMPLES DE BONNES NOUVELLES PRÉPARATIONS :** "Fond de veau", "Sauce hollandaise", "Pâte brisée", "Confit d'oignons".
            -   **EXEMPLES DE MAUVAISES NOUVELLES PRÉPARATIONS (À NE PAS FAIRE) :** "Sauce à la crème pour poulet", "Sauce minute au poivre", "Garniture de légumes rôtis".
        3.  **Si une sauce, une vinaigrette, un jus ou une garniture est simple et fait "à la minute", ses ingrédients doivent être listés dans le tableau \`ingredients\` principal et ses étapes intégrées directement dans la \`procedure\`. Ne la déclarez JAMAIS comme une nouvelle sous-recette.**
        4.  Les ingrédients et étapes des NOUVELLES préparations (celles listées dans \`newSubRecipes\`) ne doivent PAS être détaillés dans la procédure du plat principal. La procédure doit simplement mentionner "utiliser la Sauce X".
        
        **Instructions FONDAMENTALES :**
        1.  **Règle sur les unités :** Privilégiez systématiquement les unités de poids (g, kg) et de volume (l, ml). Utilisez "pièce" uniquement quand c'est indispensable.
        2.  **Procédure :** Rédigez une procédure technique détaillée en trois phases : "Préparation", "Cuisson", et "Service", en format Markdown. Si une phase n'est pas applicable, retournez une chaîne vide.
        3.  **Estimations :** Estimez la durée, la difficulté, la quantité produite (et son unité), et l'unité d'utilisation.
        4.  **Sortie :** Fournissez la sortie au format JSON structuré attendu.
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
    
    // Ensure arrays are not undefined
    const finalOutput: RecipeOutput = {
        ...output,
        ingredients: output.ingredients || [],
        subRecipes: output.subRecipes || [],
        newSubRecipes: output.newSubRecipes || [],
    };
    
    return finalOutput;
});
