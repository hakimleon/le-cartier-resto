
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
import { RecipeConceptInputSchema, RecipeConceptOutputSchema } from './workshop-flow';
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
    prompt: `Vous êtes un chef exécutif créant une fiche technique pour un restaurant gastronomique. Votre mission est de décomposer une recette en utilisant SYSTÉMATIQUEMENT les préparations de base déjà existantes.

Ceci est un plat complet, pas une simple préparation. Il sera servi à un client.

---
{{#if name}}
## CONTEXTE : NOM DU PLAT EN COURS DE CRÉATION
Le nom du plat que vous êtes en train de générer est : \`{{{name}}}\`
{{else}}
## CONTEXTE : CRÉATION SANS NOM INITIAL
L'utilisateur n'a pas fourni de nom. Vous devrez en créer un basé sur les ingrédients et le style, qui soit créatif et marketing.
{{/if}}
---

## LISTE DES PRÉPARATIONS EXISTANTES À UTILISER OBLIGATOIREMENT
Vous devez obligatoirement utiliser les préparations suivantes si elles correspondent à un composant de la recette :
{{#each allPreparationNames}}
- {{this}}
{{/each}}
(Si cette liste est vide, vous ne pouvez pas utiliser de sous-recettes).

---

## RÈGLES D'OR ABSOLUES
1.  **ZÉRO ALCOOL** : Vous ne devez JAMAIS, sous AUCUN prétexte, inclure un ingrédient contenant de l'alcool (vin, bière, cognac, etc.). Si une recette classique en contient, vous DEVEZ le remplacer par une alternative sans alcool (bouillon, jus de raisin, verjus) ou l’omettre.

2.  **MISSION PRINCIPALE - RÈGLE IMPÉRATIVE** :
    - Pour chaque composant identifiable d'une recette (ex: "fond de veau", "sauce tomate", "purée de carottes"), vous devez **OBLIGATOIREMENT** vérifier s'il existe dans la "LISTE DES PRÉPARATIONS EXISTANTES".
    - **SI OUI** : vous DEVEZ l'ajouter à la liste \`subRecipes\` avec son nom, une quantité et une unité. NE PAS mettre ses ingrédients dans la liste \`ingredients\`.
    - **SI NON** : vous DEVEZ lister ses ingrédients bruts et ses étapes dans la recette principale (listes \`ingredients\` et procédures).

⚠️ **Règle stricte :**
-   NE JAMAIS INVENTER de sous-recette qui n'est pas dans la liste fournie.
-   NE JAMAIS lister une préparation existante comme un ingrédient simple.
-   NE JAMAIS placer un ingrédient brut (ex: "Crème fraîche", "Poivre noir", "Filet de boeuf") dans \`subRecipes\`. Ces éléments doivent obligatoirement aller dans \`ingredients\`.

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
- Les procédures doivent être claires, concises et utiliser le format Markdown.
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
