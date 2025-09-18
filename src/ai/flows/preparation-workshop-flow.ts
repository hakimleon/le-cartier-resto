
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de préparations.
 * - generatePreparationConcept: Génère un concept de préparation à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllPreparationNames } from '../tools/recipe-tools';
import { googleAI } from '@genkit-ai/googleai';
import { PreparationConceptInputSchema, PreparationConceptOutputSchema } from './workshop-flow';
import type { PreparationConceptInput, PreparationConceptOutput } from './workshop-flow';

const preparationGenPrompt = ai.definePrompt({
    name: 'preparationWorkshopPrompt',
    input: { schema: PreparationConceptInputSchema.extend({ allPreparationNames: z.array(z.string()) }) },
    output: { schema: PreparationConceptOutputSchema },
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `Vous êtes un chef expert créant une fiche technique pour une PRÉPARATION de restaurant. Votre tâche est de structurer une recette en utilisant SYSTÉMATIQUEMENT les préparations de base déjà existantes.

---
{{#if name}}
## CONTEXTE : NOM DE LA PRÉPARATION EN COURS DE CRÉATION
Le nom de la préparation que vous êtes en train de générer est : \`{{{name}}}\`
{{else}}
## CONTEXTE : CRÉATION SANS NOM INITIAL
L'utilisateur n'a pas fourni de nom. Vous devrez en créer un basé sur les ingrédients et le style.
{{/if}}
---

## LISTE DES PRÉPARATIONS EXISTANTES À UTILISER
Vous devez obligatoirement utiliser les préparations suivantes si elles correspondent à un composant de la recette :
{{#each allPreparationNames}}
- {{this}}
{{/each}}

---

## RÈGLES D'OR ABSOLUES
1. **ZÉRO ALCOOL** : Vous ne devez JAMAIS, sous AUCUN prétexte, inclure un ingrédient contenant de l'alcool (vin, bière, cognac, etc.). Si une recette classique en contient, vous DEVEZ le remplacer par une alternative sans alcool (bouillon, jus) ou l’omettre.

2. **PAS D'AUTO-RÉFÉRENCE** : Vous ne devez JAMAIS inclure le nom de la recette en cours de création (\`{{{name}}}\`) dans la liste \`subRecipes\`. Une recette ne peut pas être son propre ingrédient.

3. **MISSION PRINCIPALE - RÈGLE IMPÉRATIVE** : 
   - Pour chaque composant d'une recette (ex: "fond de veau", "sauce tomate"), vous devez **OBLIGATOIREMENT** vérifier s'il existe dans la "LISTE DES PRÉPARATIONS EXISTANTES".
   - **SI OUI**, et si ce n'est pas le nom de la recette actuelle : vous DEVEZ l'ajouter à la liste \`subRecipes\` et NE PAS mettre ses ingrédients dans la liste \`ingredients\`.
   - **SI NON** : vous DEVEZ lister ses ingrédients bruts dans \`ingredients\`.

⚠️ Règle stricte : 
- NE JAMAIS INVENTER de sous-recette qui n'est pas dans la liste fournie. 
- NE JAMAIS lister une préparation existante comme un ingrédient simple.
- NE JAMAIS placer un ingrédient brut (ex: "Crème fraîche", "Poivre noir") dans \`subRecipes\`. Ces éléments doivent obligatoirement aller dans \`ingredients\`.

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
1. Vérifier que le nom de la recette actuelle (\`{{{name}}}\`) n'est PAS dans \`subRecipes\`.
2. Vérifier que chaque nom de \`subRecipes\` correspond EXACTEMENT à un nom de la "LISTE DES PRÉPARATIONS EXISTANTES".
3. Vérifier qu'aucun ingrédient brut (comme "Crème fraîche", "Poivre noir") n'est dans \`subRecipes\`. Si c'est le cas, corriger automatiquement en les déplaçant dans \`ingredients\`.
4. Vérifier que aucun nom présent dans \`subRecipes\` n'a ses ingrédients listés dans \`ingredients\`.
5. Vérifier qu’aucun ingrédient alcoolisé n’est présent.

⚠️ Si une de ces conditions n’est pas respectée, la sortie est INVALIDE. Vous devez corriger et régénérer jusqu’à obtenir un JSON 100% conforme.

---

## INSTRUCTIONS DE FORMATAGE
- **Si le nom n'est pas fourni en entrée, vous DEVEZ en générer un.** Le nom doit être technique et descriptif.
- Remplir \`productionQuantity\`, \`productionUnit\`, \`usageUnit\`.
- Remplir le champ \`portions\` pour indiquer combien de "parts" (portions de service pour un plat) la quantité produite représente. C'est crucial pour les purées, accompagnements, sauces, etc.
- La procédure de service (\`procedure_service\`) doit décrire la conservation/stockage.
- Sortie : fournir une réponse au format JSON strict.
- Ne laissez aucun champ vide : utilisez \`[]\` ou \`""\` si nécessaire.
`,
});

const generatePreparationConceptFlow = ai.defineFlow(
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
