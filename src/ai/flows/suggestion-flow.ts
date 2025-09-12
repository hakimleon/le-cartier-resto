
'use server';
/**
 * @fileOverview Flows pour des suggestions ponctuelles par l'IA.
 * - generateCommercialArgument: Génère un texte marketing pour un plat.
 * - generateRecipe: Élabore une recette complète à partir d'une idée.
 * - generateDerivedPreparations: Suggère des recettes dérivées d'une préparation de base.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- Flow pour l'argumentaire commercial ---

const CommercialArgumentInputSchema = z.object({
  name: z.string().describe("Le nom du plat."),
  description: z.string().optional().describe("La description du plat."),
  ingredients: z.array(z.string()).optional().describe("Liste des ingrédients principaux."),
});

const CommercialArgumentOutputSchema = z.object({
  argument: z.string().describe("L'argumentaire commercial concis et alléchant pour le menu."),
});

export async function generateCommercialArgument(input: z.infer<typeof CommercialArgumentInputSchema>): Promise<z.infer<typeof CommercialArgumentOutputSchema>> {
  const prompt = `Génère un argumentaire commercial court et percutant (2 phrases maximum) pour un plat de restaurant. Sois créatif et utilise un langage qui met l'eau à la bouche.

Plat : ${input.name}
Description : ${input.description || 'Non fournie'}
Ingrédients clés : ${input.ingredients?.join(', ') || 'Non fournis'}

Ton unique sortie doit être l'argumentaire.`;

  const { output } = await ai.generate({
    prompt,
    model: 'googleai/gemini-2.5-flash',
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

const RecipeOutputSchema = z.object({
    ingredients: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string().describe("Unité de mesure comme 'g', 'kg', 'ml', 'l', 'pièce'.")
    })),
    procedure_preparation: z.string().describe("Procédure de préparation en Markdown."),
    procedure_cuisson: z.string().describe("Procédure de cuisson en Markdown."),
    procedure_service: z.string().describe("Procédure de service/dressage en Markdown."),
    duration: z.number().int().describe("Durée totale en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']),
    // Pour les préparations
    productionQuantity: z.number().optional(),
    productionUnit: z.string().optional(),
    usageUnit: z.string().optional(),
});

export async function generateRecipe(input: z.infer<typeof RecipeInputSchema>): Promise<z.infer<typeof RecipeOutputSchema>> {
  const prompt = `Tu es un chef de cuisine. Élabore une fiche technique complète pour la ${input.type.toLowerCase()} suivante.
Nom : ${input.name}
Description : ${input.description || 'Non fournie.'}

Fournis une liste d'ingrédients réaliste et des étapes claires (préparation, cuisson, service). Estime la durée et la difficulté.
Si c'est une préparation, estime une quantité produite (productionQuantity) et une unité (productionUnit), ainsi qu'une unité d'utilisation (usageUnit).
Ne fournis QUE la réponse au format JSON demandé.
`;
  const { output } = await ai.generate({
    prompt,
    model: 'googleai/gemini-2.5-flash',
    output: {
      format: 'json',
      schema: RecipeOutputSchema,
    },
  });
  return output!;
}

// --- Flow pour les préparations dérivées ---

const DerivedPreparationsInputSchema = z.object({
    basePreparationName: z.string().describe("Nom de la préparation de base."),
    basePreparationDescription: z.string().optional().describe("Description de la préparation de base."),
});

const DerivedPreparationsOutputSchema = z.object({
    suggestions: z.array(z.object({
        name: z.string().describe("Nom de la préparation dérivée suggérée."),
        description: z.string().describe("Courte description expliquant la suggestion et ses cas d'usage."),
    })).describe("Liste de 3 suggestions de préparations dérivées."),
});

export type DerivedPreparationsOutput = z.infer<typeof DerivedPreparationsOutputSchema>;

export async function generateDerivedPreparations(input: z.infer<typeof DerivedPreparationsInputSchema>): Promise<DerivedPreparationsOutput> {
    const prompt = `En tant que chef expert, je te donne une préparation de base. Propose-moi 3 préparations "filles" (dérivées) qui peuvent être créées à partir de cette base.

Préparation de base : "${input.basePreparationName}"
Description : ${input.basePreparationDescription || 'Aucune description.'}

Pour chaque suggestion, donne un nom et une courte description (1-2 phrases) expliquant l'idée.

Voici des exemples de ce qui est attendu :
- Exemple 1: Si la base est "Sauce Tomate", tu pourrais suggérer "Sauce Arrabbiata" (version pimentée), "Sauce Bolognaise" (enrichie de viande), ou "Sauce Piperade" (complétée avec des poivrons).
- Exemple 2: Si la base est "Sauce Béchamel", tu pourrais suggérer "Sauce Mornay" (avec du fromage), "Sauce à la crème" (enrichie de crème fraîche), ou "Sauce Soubise" (avec une purée d'oignons).

IMPORTANT : Ne suggère JAMAIS de plats finis (comme 'Lasagnes'), mais bien des variations de la préparation de base qui sont elles-mêmes des préparations.

Fournis uniquement la réponse au format JSON demandé.`;

    const { output } = await ai.generate({
        prompt,
        model: 'googleai/gemini-2.5-flash',
        output: {
            format: 'json',
            schema: DerivedPreparationsOutputSchema,
        },
    });
    return output!;
}
