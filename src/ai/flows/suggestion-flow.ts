
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
    })).describe("La liste des ingrédients bruts pour la recette, n'incluant pas les composants des sous-recettes."),
    subRecipes: z.array(z.string()).describe("La liste des noms des sous-recettes EXISTANTES (qui étaient dans la liste fournie par l'outil) utilisées dans cette recette."),
    procedure_preparation: z.string().describe("Les étapes détaillées de la phase de préparation. DOIT être formaté en Markdown avec des titres (###) et des listes à puces (-)."),
    procedure_cuisson: z.string().describe("Les étapes détaillées de la phase de cuisson. DOIT être formaté en Markdown avec des titres (###) et des listes à puces (-)."),
    procedure_service: z.string().describe("Les étapes détaillées pour le service ou le dressage. DOIT être formaté en Markdown avec des titres (###) et des listes à puces (-)."),
    duration: z.number().int().describe("La durée totale de préparation en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Le niveau de difficulté de la recette."),
    productionQuantity: z.number().describe("La quantité totale que la recette produit. DOIT être calculé en se basant sur la somme des poids/volumes des ingrédients, en tenant compte d'une éventuelle réduction à la cuisson."),
    productionUnit: z.string().describe("L'unité de la quantité produite (ex: kg, l, pièces). DOIT être cohérente avec le calcul de productionQuantity."),
    usageUnit: z.string().describe("L'unité suggérée pour l'utilisation de cette préparation dans d'autres recettes (ex: g, ml, pièce)."),
});
export type RecipeOutput = z
.infer<typeof RecipeOutputSchema>;


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
        Vous êtes un chef de cuisine expert spécialisé dans les cuisines gastronomiques française, algérienne, italienne et méditerranéenne. 
        Votre mission est de créer une fiche technique détaillée et professionnelle pour des restaurants, en vous basant sur la recette classique et fondamentale universellement reconnue pour le nom fourni.

        Nom: {{{name}}}
        Description: {{{description}}}
        Type de Fiche: {{{type}}}

        **Instructions FONDAMENTALES :**
        1.  **Consulter les préparations existantes :** Avant toute chose, utilisez l'outil \`getAvailablePreparations\` pour obtenir la liste EXACTE des préparations (sous-recettes) qui existent déjà dans la base de données du restaurant.
        2.  **Règle d'or : PRIORISER LES PRÉPARATIONS EXISTANTES.**
            -   Si la recette que vous créez nécessite une préparation de base (ex: "sauce tomate", "fond de veau", "mayonnaise maison") qui est présente dans la liste que l'outil vous a fournie, vous devez **IMPÉRATIVEMENT** et **SYSTÉMATIQUEMENT** faire deux choses :
                1. **Lister son nom dans le champ \`subRecipes\`**. C'est une obligation absolue. Ne l'omettez jamais.
                2. **NE PAS lister les ingrédients de cette préparation** (ex: ne listez pas "huile, oeuf, moutarde" si vous utilisez la sous-recette "Mayonnaise maison").
            -   La procédure doit simplement indiquer d'utiliser la préparation existante.
        3.  **Listez les ingrédients nécessaires.**
            -   Ne listez ici que les ingrédients BRUTS nécessaires pour la recette, qui ne sont PAS déjà inclus dans les sous-recettes que vous utilisez.
            -   **Règle sur les noms :** Utilisez des noms d'ingrédients génériques et standards (ex: "Tomate", "Oignon", "Poulet"). 
            -   **Règle sur les unités :** Privilégiez systématiquement les unités de poids (grammes, kg). Utilisez les litres/ml pour les liquides et "pièce" uniquement quand c'est indispensable (ex: 1 oeuf).
        4.  **IMPÉRATIF ABSOLU :** Rédigez une procédure technique et détaillée en trois phases distinctes : "Préparation", "Cuisson", et "Service". Vous devez **OBLIGATOIREMENT** et **SYSTÉMATIQUEMENT** utiliser le format Markdown (titres de section avec '###', et listes à puces avec '-'). Chaque étape doit être un item de liste. Assurez-vous qu'il y a un saut de ligne entre les titres et les listes. Si une phase n'est pas applicable, retournez une chaîne vide.
        5.  Estimez la durée totale de la recette en minutes.
        6.  Évaluez la difficulté (Facile, Moyen, Difficile).
        7.  **IMPÉRATIF : Calculez la production totale.** Estimez la quantité totale (productionQuantity) et son unité (productionUnit). Basez-vous sur la somme des poids/volumes des ingrédients bruts ET des quantités de sous-recettes utilisées, en appliquant une légère réduction logique si une cuisson intervient (évaporation). Définissez aussi l'unité d'utilisation suggérée (usageUnit).
        8.  Assurez-vous que la recette soit réalisable, gustativement équilibrée et respecte les standards de la cuisine demandée.
        9.  Fournissez la sortie au format JSON structuré attendu.
    `,
});

// Définition du flow pour la génération de recette
const generateRecipeFlow = ai.defineFlow({
    name: 'generateRecipeFlow',
    inputSchema: RecipeInputSchema,
    outputSchema: RecipeOutputSchema,
}, async (input) => {
    // Étape 1 : Obtenir la liste des préparations disponibles en amont.
    const availablePreparations = await getAvailablePreparationsTool();

    // Étape 2 : Appeler le prompt de l'IA avec le contexte nécessaire.
    const llmResponse = await recipeGenerationPrompt(input);
    const output = llmResponse.output;

    if (!output) {
        throw new Error("La génération de la recette a échoué car la sortie de l'IA est vide.");
    }
    
    // Étape 3 : GARDE-FOU. Vérifier et corriger la sortie de l'IA.
    // On combine tout le texte généré pour la procédure.
    const fullProcedureText = [
        output.procedure_preparation,
        output.procedure_cuisson,
        output.procedure_service
    ].join(' ').toLowerCase();

    // Pour chaque préparation disponible...
    for (const prepName of availablePreparations) {
        // Si le nom de la préparation (ex: "mayonnaise maison") est mentionné dans la procédure...
        // et si l'IA a "oublié" de l'ajouter dans la liste des sous-recettes...
        if (fullProcedureText.includes(prepName.toLowerCase()) && !output.subRecipes.includes(prepName)) {
            // ... alors on force son ajout !
            console.log(`Garde-fou activé: Ajout de la sous-recette manquante "${prepName}"`);
            output.subRecipes.push(prepName);
        }
    }

    return output;
});

