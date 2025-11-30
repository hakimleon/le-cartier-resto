
'use server';
/**
 * @fileOverview Flows pour des suggestions ponctuelles par l'IA.
 * - generateCommercialArgument: Génère un texte marketing pour un plat.
 * - generateRecipe: Élabore une recette complète à partir d'une idée.
 * - generateDerivedPreparations: Suggère des recettes dérivées d'une préparation de base.
 * - generateIngredientAlternative: Suggère des alternatives pour un ingrédient donné.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// --- Flow pour l'argumentaire commercial ---

const CommercialArgumentInputSchema = z.object({
  name: z.string().describe("Le nom du plat."),
  description: z.string().optional().describe("La description du plat."),
  ingredients: z.array(z.string()).optional().describe("Liste des ingrédients principaux."),
});
export type CommercialArgumentInput = z.infer<typeof CommercialArgumentInputSchema>;

const CommercialArgumentOutputSchema = z.object({
  argument: z.string().describe("L'argumentaire commercial concis et alléchant pour le menu."),
});
export type CommercialArgumentOutput = z.infer<typeof CommercialArgumentOutputSchema>;


export async function generateCommercialArgument(input: CommercialArgumentInput): Promise<CommercialArgumentOutput> {
  const prompt = `Génère un argumentaire commercial court et percutant (2 phrases maximum) pour un plat de restaurant. Sois créatif et utilise un langage qui met l'eau à la bouche.

Plat : ${input.name}
Description : ${input.description || 'Non fournie'}
Ingrédients clés : ${input.ingredients?.join(', ') || 'Non fournis'}

Ton unique sortie doit être l'argumentaire.`;

  const { output } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt,
    output: {
      schema: CommercialArgumentOutputSchema,
    }
  });
  return output!;
}


// --- Flow pour l'élaboration de recette (utilisé sur la page de détail de préparation) ---

const RecipeInputSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['Plat', 'Préparation']),
});
export type RecipeInput = z.infer<typeof RecipeInputSchema>;

const RecipeOutputSchema = z.object({
    ingredients: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string().describe("Unité de mesure comme 'g', 'kg', 'ml', 'l', 'pièce'.")
    })),
    procedure_fabrication: z.string().describe("Procédure de fabrication (préparation et cuisson) en Markdown."),
    procedure_service: z.string().describe("Procédure de service/dressage en Markdown."),
    duration: z.number().int().describe("Durée totale en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']),
    // Pour les préparations
    productionQuantity: z.number().optional(),
    productionUnit: z.string().optional(),
    usageUnit: z.string().optional(),
});
export type RecipeOutput = z.infer<typeof RecipeOutputSchema>;

export async function generateRecipe(input: RecipeInput): Promise<RecipeOutput> {
  const prompt = `Tu es un chef de cuisine. Élabore une fiche technique complète pour la ${input.type.toLowerCase()} suivante.
Nom : ${input.name}
Description : ${input.description || 'Non fournie.'}

Fournis une liste d'ingrédients réaliste et des étapes claires (fabrication, service). Estime la durée et la difficulté.
Pour la liste des ingrédients, fournis IMPÉRATIVEMENT juste le nom, la quantité et l'unité. N'ajoute aucun qualificatif ou commentaire dans le nom de l'ingrédient (ex: "carottes fraîches" doit être juste "carottes").

Si c'est une préparation, estime une quantité produite (productionQuantity) et une unité (productionUnit), ainsi qu'une unité d'utilisation (usageUnit).
Ne fournis QUE la réponse au format JSON demandé, correspondant à ce schéma : ${JSON.stringify(RecipeOutputSchema.jsonSchema)}
`;
  const { text } = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    prompt,
  });
  try {
    return JSON.parse(text) as RecipeOutput;
  } catch(e) {
    console.error("Failed to parse JSON from generateRecipe AI response:", text);
    throw new Error("La réponse de l'IA n'était pas un JSON valide.");
  }
}

// --- Flow pour les préparations dérivées ---

const DerivedPreparationsInputSchema = z.object({
    basePreparationName: z.string().describe("Nom de la préparation de base."),
    basePreparationDescription: z.string().optional().describe("Description de la préparation de base."),
});
export type DerivedPreparationsInput = z.infer<typeof DerivedPreparationsInputSchema>;


const DerivedPreparationsOutputSchema = z.object({
    suggestions: z.array(z.object({
        name: z.string().describe("Nom de l'utilisation ou de la préparation dérivée (ex: 'Pour les viandes rouges', 'Sauce Bigarade')."),
        description: z.string().describe("Courte description expliquant l'application concrète (ex: 'Nappage pour côtes de bœuf', 'Dérivée avec des agrumes pour le canard')."),
    })).describe("Liste de 5 suggestions d'applications culinaires concrètes pour la préparation."),
});
export type DerivedPreparationsOutput = z.infer<typeof DerivedPreparationsOutputSchema>;

export async function generateDerivedPreparations(input: DerivedPreparationsInput): Promise<DerivedPreparationsOutput> {
    const prompt = `En tant que chef exécutif, je te donne une préparation de base et tu dois me fournir un guide d'application culinaire. L'objectif est de standardiser son utilisation, de maîtriser la créativité et d'éviter le gaspillage.

Préparation de base : "${input.basePreparationName}"
Description : ${input.basePreparationDescription || 'Aucune description.'}

Ta tâche est de proposer 5 "accompagnements / utilisations" concrets. Pense comme une "boîte à outils" : comment cette base peut-elle être utilisée ou transformée ?

Pour chaque suggestion :
1.  **Nom (name)** : Donne un titre clair et concis. Ce peut être une catégorie d'utilisation (ex: "Pour viandes rouges") ou le nom d'une préparation dérivée (ex: "Sauce Chasseur").
2.  **Description (description)** : Explique l'application précise. Sois spécifique. Au lieu de dire "pour la viande", dis "en nappage sur un filet de bœuf" ou "comme base pour une sauce au poivre".

Exemple pour un "Fond brun de veau" :
- name: "Jus corsé pour viandes rouges"
  description: "Réduction simple pour napper un filet de bœuf ou une côte de veau."
- name: "Base de sauces classiques"
  description: "Utiliser comme mouillement pour monter une sauce bordelaise ou chasseur."
- name: "Mouillement pour braisés"
  description: "Idéal pour braiser des joues de bœuf ou un jarret d'agneau, apporte de la profondeur."
- name: "Glace de viande"
  description: "Réduire à consistance sirupeuse pour monter des sauces minute au beurre."
- name: "Liaison de farces"
  description: "Ajouter une petite quantité pour renforcer le goût des farces ou garnitures."

Fournis uniquement la réponse au format JSON demandé. Ne crée pas de plats finis complexes, mais bien des applications directes ou des transformations simples de la base.`;

    const { text } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'),
        prompt,
    });
     try {
        return JSON.parse(text) as DerivedPreparationsOutput;
    } catch (e) {
        console.error("Failed to parse JSON from generateDerivedPreparations AI response:", text);
        throw new Error("La réponse de l'IA n'était pas un JSON valide.");
    }
}


// --- Flow pour les alternatives d'ingrédients ---

const IngredientAlternativeInputSchema = z.object({
  ingredientName: z.string().describe("L'ingrédient à remplacer."),
  recipeContext: z.string().describe("Le nom de la recette dans laquelle l'ingrédient est utilisé."),
  constraints: z.string().optional().describe("Contraintes à respecter (ex: 'sans alcool', 'végétarien', 'moins cher').")
});
export type IngredientAlternativeInput = z.infer<typeof IngredientAlternativeInputSchema>;

const IngredientAlternativeOutputSchema = z.object({
  suggestions: z.array(z.object({
    name: z.string().describe("Le nom de l'ingrédient de remplacement."),
    justification: z.string().describe("Brève explication du pourquoi ce substitut fonctionne (goût, texture, etc.).")
  })).describe("Liste de 3 suggestions d'alternatives pertinentes.")
});
export type IngredientAlternativeOutput = z.infer<typeof IngredientAlternativeOutputSchema>;

export async function generateIngredientAlternative(input: IngredientAlternativeInput): Promise<IngredientAlternativeOutput> {
  const prompt = `Tu es un chef de cuisine créatif et expérimenté. Un autre chef te demande de l'aide pour trouver un substitut.

Ingrédient à remplacer: "${input.ingredientName}"
Dans le contexte de la recette: "${input.recipeContext}"
${input.constraints ? `Contrainte impérative: "${input.constraints}"` : ''}

Propose 3 alternatives pertinentes. Pour chaque suggestion, fournis le nom du substitut et une justification concise expliquant pourquoi c'est un bon choix (profil de goût, rôle dans la recette, etc.).

Réponds uniquement au format JSON demandé.`;

    const { text } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'),
        prompt,
    });

    try {
        return JSON.parse(text) as IngredientAlternativeOutput;
    } catch (e) {
        console.error("Failed to parse JSON from generateIngredientAlternative AI response:", text);
        throw new Error("La réponse de l'IA n'était pas un JSON valide.");
    }
}
