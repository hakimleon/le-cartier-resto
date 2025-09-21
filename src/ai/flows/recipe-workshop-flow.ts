
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
    prompt: `Vous êtes un chef expert créant une fiche technique pour un restaurant. Votre tâche est de structurer une recette en utilisant SYSTÉMATIQUEMENT les préparations de base déjà existantes et en identifiant clairement les nouvelles préparations que vous inventez.

---
{{#if name}}
## CONTEXTE : NOM DE LA RECETTE EN COURS DE CRÉATION
Le nom de la recette que vous êtes en train de générer est : \`{{{name}}}\`
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
1.  **ZÉRO ALCOOL** : Vous ne devez JAMAIS inclure un ingrédient contenant de l'alcool. Remplacez-le systématiquement (ex: Cognac → jus de raisin blanc réduit, Vin rouge → fond brun réduit).
2.  **PAS D'AUTO-RÉFÉRENCE** : Vous ne devez JAMAIS inclure le nom de la recette en cours de création (\`{{{name}}}\`) dans les listes \`subRecipes\` ou \`newSubRecipes\`.

### MISSION PRINCIPALE : GESTION DES SOUS-RECETTES
Pour chaque composant d'une recette (ex: "fond de veau", "sauce vierge", "vinaigrette"), suivez ce processus :

1.  **VÉRIFICATION** : Le composant existe-t-il dans la "LISTE DES PRÉPARATIONS EXISTANTES" ?
2.  **ANALYSE & TRI**
    *   **CAS 1 : La préparation EXISTE**
        *   Ajoutez son nom exact à la liste \`subRecipes\`.
        *   NE PAS inclure ses ingrédients ou ses étapes.
    *   **CAS 2 : La préparation est INVENTÉE par vous** (elle n'est PAS dans la liste)
        *   Ajoutez-la à la liste \`newSubRecipes\` avec un nom technique clair et une courte description de son rôle.
        *   NE PAS inclure ses ingrédients ou ses étapes dans la recette principale. Vous devez seulement lister le nom de la nouvelle préparation.
    *   **CAS 3 : C'est un ingrédient brut ou un assemblage trop simple** (ex: "salade verte assaisonnée", "beurre fondu")
        *   Listez les ingrédients bruts dans \`ingredients\`.
        *   Décrivez les étapes dans la procédure principale.
        *   NE PAS l'ajouter dans \`subRecipes\` ou \`newSubRecipes\`.

⚠️ Règle stricte : Le but est de décomposer la recette en blocs. Ne mettez les ingrédients/étapes dans la procédure principale QUE s'ils ne font pas partie d'une sous-recette (existante ou nouvelle).

---

{{#if rawRecipe}}
PRIORITÉ : Reformatez la recette brute suivante en respectant TOUTES les règles.
---
{{{rawRecipe}}}
---
{{else}}
CRÉATION : Créez une nouvelle fiche technique en respectant TOUTES les règles.
- Type de Fiche: {{{type}}}
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

## INSTRUCTIONS DE FORMATAGE
- **Si le nom n'est pas fourni, générez-en un** qui soit créatif et marketing.
- Remplissez tous les champs demandés (\`portions\`, \`category\`, \`commercialArgument\`, etc.).
- Ne laissez aucun champ vide : utilisez \`[]\` ou \`""\` si nécessaire.
- La sortie doit être un JSON strict et valide.
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
