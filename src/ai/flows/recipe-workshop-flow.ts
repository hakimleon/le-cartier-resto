
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes (plats).
 * - generateRecipeConcept: Génère un concept complet (recette + image) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { getAllPreparationNames } from '../tools/recipe-tools';
import { googleAI } from '@genkit-ai/googleai';
import { RecipeConceptInputSchema, RecipeConceptOutputSchema, NewSubRecipeSchema } from './workshop-flow';
import type { RecipeConceptInput, RecipeConceptOutput } from './workshop-flow';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const RecipeTextConceptSchema = RecipeConceptOutputSchema.omit({ imageUrl: true });


const recipeGenPrompt = ai.definePrompt({
    name: 'recipeWorkshopPrompt',
    input: { schema: RecipeConceptInputSchema.extend({ allPreparationNames: z.array(z.string()) }) },
    output: { schema: RecipeTextConceptSchema },
    model: googleAI.model('gemini-1.5-flash-latest'),
    prompt: `Vous êtes un chef exécutif créant une fiche technique pour un restaurant gastronomique. Votre mission est de décomposer une recette en blocs logiques : ingrédients bruts, sous-recettes existantes, et sous-recettes à créer.

---
## CONTEXTE
{{#if name}}Nom de la recette: \`{{{name}}}\`{{else}}Création d'une nouvelle recette.{{/if}}

---
## MISSION PRINCIPALE : GESTION STRUCTURÉE DES SOUS-RECETTES

Pour chaque composant identifiable de la recette (ex: une sauce, une purée, un jus, une vinaigrette, une pâte), vous devez suivre IMPÉRATIVEMENT ce processus de décision :

**ÉTAPE 1 : Le composant est-il dans la "LISTE DES PRÉPARATIONS EXISTANTES" ci-dessous ?**

*   **OUI :**
    1.  Ajoutez son nom et sa quantité/unité dans la liste \`subRecipes\`.
    2.  NE PAS lister ses ingrédients ni ses étapes dans la recette principale.
    3.  Passez au composant suivant.

*   **NON, PASSEZ À L'ÉTAPE 2.**

**ÉTAPE 2 : Le composant est-il une "vraie" sous-recette qui pourrait être standardisée et réutilisée ?**
(Ex: "Sauce aux morilles", "Vinaigrette balsamique", "Purée de panais", "Pâte brisée")

*   **OUI :**
    1.  Donnez-lui un nom technique clair.
    2.  Ajoutez-le à la liste \`newSubRecipes\` avec son nom et une brève description de son rôle.
    3.  NE PAS lister ses ingrédients ni ses étapes. L'IA se contente de le signaler comme "à créer".
    4.  Passez au composant suivant.

*   **NON (c'est un assemblage simple ou un ingrédient brut), PASSEZ À L'ÉTAPE 3.**
    (Ex: "beurre fondu", "salade assaisonnée", "suprême de volaille juste poêlé")

**ÉTAPE 3 : Traiter comme ingrédient brut ou étape simple.**
1.  Listez les ingrédients bruts nécessaires (ex: "beurre", "sel", "huile") dans la liste \`ingredients\`.
2.  Décrivez l'action (ex: "Faire fondre le beurre") dans la procédure principale (\`procedure_preparation\`, \`procedure_cuisson\` ou \`procedure_service\`).

---
## LISTE DES PRÉPARATIONS EXISTANTES (À UTILISER OBLIGATOIREMENT)
{{#each allPreparationNames}}
- {{this}}
{{/each}}
(Si cette liste est vide, vous devrez tout traiter comme des "newSubRecipes" ou des ingrédients bruts.)

---
## RÈGLES ABSOLUES
1.  **ZÉRO ALCOOL** : Interdiction formelle d'utiliser de l'alcool. Remplacez par des alternatives (bouillon, jus, verjus).
2.  **PAS D'AUTO-RÉFÉRENCE** : Ne jamais inclure le nom de la recette principale (\`{{{name}}}\`) dans \`subRecipes\` ou \`newSubRecipes\`.

---
## DEMANDE UTILISATEUR

{{#if rawRecipe}}
**Priorité : Reformater la recette brute suivante en respectant TOUTES les règles.**
\`\`\`
{{{rawRecipe}}}
\`\`\`
{{else}}
**Créer une nouvelle fiche technique en respectant TOUTES les règles.**
- Type de Fiche: {{{type}}}
- Nom/Idée : {{{name}}}
- Description: {{{description}}}
- Ingrédients principaux : {{{mainIngredients}}}
- À exclure : {{{excludedIngredients}}}
- Recommandations : {{{recommendations}}}
{{/if}}

{{#if refinementHistory}}
- **Historique des demandes (à respecter) :**
{{#each refinementHistory}}
    - "{{{this}}}"
{{/each}}
{{/if}}

{{#if currentRefinement}}
- **Instruction d'affinage (priorité absolue) : "{{{currentRefinement}}}"**
{{/if}}

---
## INSTRUCTIONS DE FORMATAGE DE SORTIE
- Remplissez tous les champs demandés (\`name\`, \`description\`, \`portions\`, \`category\`, \`commercialArgument\`, etc.).
- Si le nom n'est pas fourni, générez-en un qui soit créatif et marketing.
- Ne laissez aucun champ vide : utilisez \`[]\` ou \`""\` si nécessaire.
- La sortie doit être un JSON strict et valide, sans aucun commentaire.
`,
});

const generateRecipeConceptFlow = ai.defineFlow(
    {
        name: 'generateRecipeConceptFlow',
        inputSchema: RecipeConceptInputSchema,
        outputSchema: RecipeConceptOutputSchema,
    },
    async (input) => {
        // 1. Get all existing preparation names to inject them into the prompt
        const allPreparationNames = await getAllPreparationNames();

        const inputWithContext = {
            ...input,
            allPreparationNames,
            cacheBuster: Math.random() // Add cache buster here
        };

        // 2. Generate the textual concept of the recipe
        const { output: recipeConcept } = await recipeGenPrompt(inputWithContext);

        if (!recipeConcept) {
            throw new Error("La génération du concept de la recette a échoué.");
        }

        let finalOutput: RecipeConceptOutput = { ...recipeConcept, imageUrl: undefined };

        // 3. If it's a dish, generate an image
        if (input.type === 'Plat') {
            let imageUrl = `https://placehold.co/1024x768/fafafa/7d7d7d.png?text=${encodeURIComponent(recipeConcept.name)}`;

            try {
                const imagePrompt = `Photographie culinaire professionnelle, style magazine gastronomique. Plat : "${recipeConcept.name}". Description : "${recipeConcept.description}". Dressage : "${recipeConcept.procedure_service}". Éclairage de studio, faible profondeur de champ.`;

                const { media } = await ai.generate({
                    model: 'googleai/imagen-4.0-fast-generate-001',
                    prompt: imagePrompt,
                });

                if (media?.url) {
                    const uploadResult = await cloudinary.uploader.upload(media.url, {
                        folder: "le-singulier-ai-generated",
                        resource_type: "image",
                    });
                    imageUrl = uploadResult.secure_url;
                }
            } catch (error) {
                console.error("Erreur de génération/téléversement d'image, utilisation du placeholder.", error);
            }
            finalOutput.imageUrl = imageUrl;
        }

        return finalOutput;
    }
);

// Main exported function
export async function generateRecipeConcept(input: RecipeConceptInput): Promise<RecipeConceptOutput> {
    return generateRecipeConceptFlow(input);
}
