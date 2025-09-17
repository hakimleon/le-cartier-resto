
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de préparations.
 * - generatePreparationConcept: Génère un concept de préparation à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllPreparationNames } from '../tools/recipe-tools';

const PreparationConceptInputSchema = z.object({
    name: z.string().describe("Le nom ou l'idée de base de la préparation."),
    description: z.string().optional().describe("La description de la préparation."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style ou la consistance souhaitée."),
    rawRecipe: z.string().optional().describe("Une recette complète en texte brut à reformater. Si ce champ est fourni, l'IA doit l'utiliser comme source principale."),
    refinementHistory: z.array(z.string()).optional().describe("L'historique des instructions d'affinage précédentes."),
    currentRefinement: z.string().optional().describe("La nouvelle instruction d'affinage à appliquer."),
    cacheBuster: z.number().optional().describe("Valeur aléatoire pour éviter la mise en cache."),
});
export type PreparationConceptInput = z.infer<typeof PreparationConceptInputSchema>;

const PreparationConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final de la préparation."),
    description: z.string().describe("Une description technique et fonctionnelle."),
    
    ingredients: z.array(z.object({
        name: z.string().describe("Nom de l'ingrédient."),
        quantity: z.number().describe("Quantité."),
        unit: z.string().describe("Unité (g, kg, ml, l, pièce).")
    })).describe("Liste des ingrédients nécessaires."),
    subRecipes: z.array(z.object({
        name: z.string().describe("Nom de la sous-recette EXISTANTE."),
        quantity: z.number().describe("Quantité de sous-recette."),
        unit: z.string().describe("Unité pour la sous-recette."),
    })).describe("Liste des sous-recettes EXISTANTES utilisées."),
    procedure_preparation: z.string().describe("Procédure de préparation (Markdown)."),
    procedure_cuisson: z.string().describe("Procédure de cuisson (Markdown)."),
    procedure_service: z.string().describe("Procédure de conservation/stockage (Markdown)."),
    duration: z.number().int().describe("Durée totale de production en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Niveau de difficulté."),
    
    productionQuantity: z.number().optional().describe("Quantité totale produite."),
    productionUnit: z.string().optional().describe("Unité de production (kg, l, pièces)."),
    usageUnit: z.string().optional().describe("Unité d'utilisation suggérée (g, ml, pièce)."),
});
export type PreparationConceptOutput = z.infer<typeof PreparationConceptOutputSchema>;


const preparationGenPrompt = ai.definePrompt({
    name: 'preparationWorkshopPrompt',
    input: { schema: PreparationConceptInputSchema.extend({ allPreparationNames: z.array(z.string()) }) },
    output: { schema: PreparationConceptOutputSchema },
    model: 'googleai/gemini-1.5-flash',
    prompt: `Vous êtes un chef expert créant une fiche technique pour une PRÉPARATION de restaurant. Votre tâche est de structurer une recette en utilisant SYSTÉMATIQUEMENT les préparations de base déjà existantes.

---

## CONTEXTE : NOM DE LA PRÉPARATION EN COURS DE CRÉATION
Le nom de la préparation que vous êtes en train de générer est : \`{{{name}}}\`

---

## LISTE DES PRÉPARATIONS EXISTANTES À UTILISER
Vous devez obligatoirement utiliser les préparations suivantes si elles correspondent à un composant de la recette :
{{#each allPreparationNames}}
- {{this}}
{{/each}}

---

## RÈGLES D'OR ABSOLUES
1.  **ZÉRO ALCOOL** : Vous ne devez JAMAIS, sous AUCUN prétexte, inclure un ingrédient contenant de l'alcool (vin, bière, cognac, etc.). Si une recette classique en contient, vous DEVEZ le remplacer par une alternative sans alcool (bouillon, jus) ou l’omettre.

2.  **PAS D'AUTO-RÉFÉRENCE** : Vous ne devez JAMAIS inclure le nom de la recette en cours de création (\`{{{name}}}\`) dans la liste \`subRecipes\`. Une recette ne peut pas être son propre ingrédient. C'est une erreur logique capitale.

3.  **MISSION PRINCIPALE - RÈGLE IMPÉRATIVE** : Pour chaque composant d'une recette (ex: "fond de veau", "sauce tomate"), vous devez **OBLIGATOIREMENT** vérifier s'il existe dans la "LISTE DES PRÉPARATIONS EXISTANTES".
    *   **SI OUI**, et si ce n'est pas le nom de la recette actuelle : vous DEVEZ l'ajouter à la liste \`subRecipes\` et NE PAS mettre ses ingrédients dans la liste \`ingredients\`. C'est une obligation, pas une suggestion.
    *   **SI NON** : vous DEVEZ lister ses ingrédients bruts dans \`ingredients\`.

⚠️ Règle stricte : NE JAMAIS INVENTER de sous-recette qui n'est pas dans la liste fournie. NE JAMAIS lister une préparation existante comme un ingrédient simple.

---

{{#if rawRecipe}}
PRIORITÉ : Reformatez la recette brute suivante en respectant TOUTES les règles.
---
{{{rawRecipe}}}
---
{{else}}
CRÉATION : Créez une nouvelle fiche technique en respectant TOUTES les règles.
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

---

## ÉTAPE DE CONTRÔLE AVANT LA SORTIE JSON
Avant de produire la réponse finale, vous DEVEZ :
1.  Vérifier que le nom de la recette actuelle (\`{{{name}}}\`) n'est PAS dans \`subRecipes\`.
2.  Pour chaque nom dans \`subRecipes\`, vérifier qu'il est bien présent dans la "LISTE DES PRÉPARATIONS EXISTANTES" fournie au début.
3.  Vérifier qu'aucun nom présent dans \`subRecipes\` n'a ses ingrédients listés dans \`ingredients\`. Le "fond de veau", s'il est une préparation, ne doit pas avoir "os de veau" dans la liste d'ingrédients de la recette actuelle.
4.  Vérifier qu’aucun ingrédient alcoolisé n’est présent.

⚠️ Si une de ces conditions n’est pas respectée, la sortie est INVALIDE. Vous devez corriger et régénérer jusqu’à obtenir un JSON 100% conforme.

---

## INSTRUCTIONS DE FORMATAGE
- Remplir \`productionQuantity\`, \`productionUnit\`, \`usageUnit\`.
- La procédure de service (\`procedure_service\`) doit décrire la conservation/stockage.
- Sortie : fournir une réponse au format JSON strict.
- Ne laissez aucun champ vide : utilisez \`[]\` ou \`""\` si nécessaire.
`,
});

export const generatePreparationConceptFlow = ai.defineFlow(
    {
        name: 'generatePreparationConceptFlow',
        inputSchema: PreparationConceptInputSchema,
        outputSchema: PreparationConceptOutputSchema,
    },
    async (input) => {
        const allPreparationNames = await getAllPreparationNames();

        const inputWithContext = {
            ...input,
            allPreparationNames,
            cacheBuster: Math.random()
        };
        
        const { output } = await preparationGenPrompt(inputWithContext);

        if (!output) {
            throw new Error("La génération du concept de la préparation a échoué.");
        }

        return output;
    }
);

// Main exported function
export async function generatePreparationConcept(input: PreparationConceptInput): Promise<PreparationConceptOutput> {
    return generatePreparationConceptFlow(input);
}
