'use server';
/**
 * @fileOverview Flow pour l'atelier de création de garnitures.
 * - generateGarnishConcept: Génère un concept de garniture à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllPreparationNames } from '../tools/recipe-tools';
import { googleAI } from '@genkit-ai/googleai';
import { PreparationConceptInput, PreparationConceptOutput, PreparationConceptOutputSchema } from './preparation-workshop-flow';


const garnishGenPrompt = ai.definePrompt({
    name: 'garnishWorkshopPrompt',
    input: { schema: z.object({ allPreparationNames: z.array(z.string()) }).extend(PreparationConceptInput.shape) },
    output: { schema: PreparationConceptOutputSchema },
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `Vous êtes un chef expert créant une fiche technique pour une GARNITURE ou un ACCOMPAGNEMENT de restaurant. Votre tâche est de structurer une recette en utilisant SYSTÉMATIQUEMENT les préparations de base déjà existantes.

Ceci est une garniture, pas un plat complet. Elle sera combinée plus tard avec une protéine. Exemples : Purée de pommes de terre, Gratin Dauphinois, Tian de légumes, Poêlée de champignons.

---
{{#if name}}
## CONTEXTE : NOM DE LA GARNITURE EN COURS DE CRÉATION
Le nom de la garniture que vous êtes en train de générer est : \`{{{name}}}\`
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

## INSTRUCTIONS DE FORMATAGE SPÉCIFIQUES AUX GARNITURES
- Le champ \`portions\` est crucial : il doit indiquer combien de "portions d'accompagnement" la recette produit. (Ex: un gratin de 1kg peut faire 10 portions de 100g).
- \`productionQuantity\` et \`productionUnit\` doivent refléter la quantité totale produite (Ex: 1.2 kg).
- \`usageUnit\` doit être l'unité utilisée DANS les plats (Ex: 'g' ou 'portion'). Si la garniture est utilisée à la portion, mettez 'portion'.
- La procédure de service (\`procedure_service\`) doit décrire la conservation, le stockage, et la remise en température/service.
- Sortie : fournir une réponse au format JSON strict.
`,
});

export const generateGarnishConceptFlow = ai.defineFlow(
    {
        name: 'generateGarnishConceptFlow',
        inputSchema: PreparationConceptInput,
        outputSchema: PreparationConceptOutputSchema,
    },
    async (input) => {
        const allPreparationNames = await getAllPreparationNames();

        const inputWithContext = {
            ...input,
            allPreparationNames,
            cacheBuster: Math.random()
        };
        
        const { output } = await garnishGenPrompt(inputWithContext);

        if (!output) {
            throw new Error("La génération du concept de la garniture a échoué.");
        }

        return output;
    }
);

// Main exported function
export async function generateGarnishConcept(input: PreparationConceptInput): Promise<PreparationConceptOutput> {
    return generateGarnishConceptFlow(input);
}
