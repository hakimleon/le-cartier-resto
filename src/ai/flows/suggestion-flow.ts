
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
    })).describe("La liste des ingrédients pour la recette."),
    procedure_preparation: z.string().describe("Les étapes détaillées de la phase de préparation. DOIT être formaté en Markdown avec des titres (###) et des listes à puces (-)."),
    procedure_cuisson: z.string().describe("Les étapes détaillées de la phase de cuisson. DOIT être formaté en Markdown avec des titres (###) et des listes à puces (-)."),
    procedure_service: z.string().describe("Les étapes détaillées pour le service ou le dressage. DOIT être formaté en Markdown avec des titres (###) et des listes à puces (-)."),
    duration: z.number().int().describe("La durée totale de préparation en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Le niveau de difficulté de la recette."),
    productionQuantity: z.number().describe("La quantité totale que la recette produit. DOIT être calculé en se basant sur la somme des poids/volumes des ingrédients, en tenant compte d'une éventuelle réduction à la cuisson."),
    productionUnit: z.string().describe("L'unité de la quantité produite (ex: kg, l, pièces). DOIT être cohérente avec le calcul de productionQuantity."),
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
        1.  **Listez les ingrédients nécessaires.**
            -   **Règle impérative sur les noms :** Utilisez des noms d'ingrédients génériques et standards (ex: "Tomate", "Oignon", "Poulet"). Évitez les termes trop spécifiques ou poétiques (ex: "Tomate Cœur de Bœuf juteuse", "Cuisse de poulet fermier"). L'utilisateur liera cet ingrédient à son produit spécifique plus tard.
            -   **Règle impérative sur les unités :** Privilégiez systématiquement les unités de poids (grammes, kg) pour les viandes, poissons, et la plupart des légumes. Utilisez les litres/ml pour les liquides et "pièce" uniquement quand c'est indispensable (ex: 1 oeuf).
        2.  **IMPÉRATIF ABSOLU :** Rédigez une procédure technique et détaillée en trois phases distinctes : "Préparation", "Cuisson", et "Service". Vous devez **OBLIGATOIREMENT** et **SYSTÉMATIQUEMENT** utiliser le format Markdown pour la procédure (titres de section avec '###', et listes à puces avec '-'). Chaque étape doit être un item de liste. Si une phase n'est pas applicable (ex: pas de cuisson pour un tartare), vous devez retourner une chaîne de caractères vide pour ce champ spécifique, mais les autres champs doivent rester en Markdown.
        3.  Estimez la durée totale de la recette en minutes.
        4.  Évaluez la difficulté (Facile, Moyen, Difficile).
        5.  **IMPÉRATIF : Calculez la production totale.** Vous devez **obligatoirement** estimer la quantité totale que la recette produit (productionQuantity) et son unité (productionUnit). Pour cela, basez-vous sur la somme des poids et/ou volumes des ingrédients listés, en appliquant une légère réduction logique si une cuisson intervient (évaporation). Par exemple, 1L de lait + 100g de farine + 100g de beurre produiront environ 1.15kg de sauce béchamel. C'est un calcul crucial. Définissez aussi l'unité d'utilisation suggérée (usageUnit), par exemple 'g' ou 'ml'.
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

    