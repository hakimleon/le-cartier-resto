
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
import { dishCategories } from '@/lib/types';

// La bibliothèque Cloudinary est configurée automatiquement si les variables d'environnement sont présentes.
// Pas besoin de cloudinary.config() ici.

const RecipeTextConceptSchema = RecipeConceptOutputSchema.omit({ imageUrl: true });


const recipeGenPrompt = ai.definePrompt({
    name: 'recipeWorkshopPrompt',
    input: { schema: RecipeConceptInputSchema.extend({ allPreparationNames: z.array(z.string()) }) },
    output: { schema: RecipeTextConceptSchema },
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `Vous êtes un chef exécutif créant une fiche technique pour un PLAT PRINCIPAL de restaurant gastronomique. Votre mission est de concevoir un plat complet, prêt à être servi au client, en utilisant potentiellement des préparations de base existantes.

---
## MISSION : CRÉER UN PLAT FINAL
- Vous créez un **PLAT**, pas une simple préparation. Exemples: "Filet de bœuf Rossini", "Bar de ligne et agrumes", "Risotto aux cèpes".
- Le résultat doit être une recette complète et cohérente.

---
{{#if name}}
## CONTEXTE : NOM DU PLAT EN COURS DE CRÉATION
Le nom du plat que vous êtes en train de générer est : \`{{{name}}}\`
{{else}}
## CONTEXTE : CRÉATION SANS NOM INITIAL
L'utilisateur n'a pas fourni de nom. Vous devrez en créer un qui soit créatif et marketing.
{{/if}}
---

## LISTE DES PRÉPARATIONS EXISTANTES À UTILISER
Si un composant de votre recette correspond à l'une de ces préparations, vous devez l'utiliser comme sous-recette (\`subRecipes\`).
{{#each allPreparationNames}}
- {{this}}
{{/each}}
(Si cette liste est vide, tous les ingrédients doivent être listés comme ingrédients bruts).

---

## CATÉGORIES DE PLAT POSSIBLES
Le champ \`category\` doit obligatoirement être l'une des valeurs suivantes :
${dishCategories.map(c => `- ${c}`).join('\n')}

---

## RÈGLES D'OR ABSOLUES
1.  **ZÉRO ALCOOL** : Vous ne devez JAMAIS inclure d'ingrédient contenant de l'alcool (vin, bière, etc.). Remplacez-le systématiquement par une alternative sans alcool (bouillon, jus, verjus) ou omettez-le.

2.  **RÈGLE DE COMPOSITION IMPÉRATIVE** :
    - Pour chaque composant identifiable de la recette (ex: "fond de veau", "purée de carottes"), vérifiez s'il existe dans la "LISTE DES PRÉPARATIONS EXISTANTES".
    - **SI OUI** : Ajoutez-le à la liste \`subRecipes\` avec une quantité et une unité. NE listez PAS ses propres ingrédients dans la liste \`ingredients\` de la recette principale.
    - **SI NON** : Listez ses ingrédients bruts dans la liste \`ingredients\` et ses étapes dans les procédures de la recette principale.

⚠️ **Erreurs à ne pas commettre :**
-   NE JAMAIS inventer de sous-recette qui n'est pas dans la liste fournie.
-   NE JAMAIS lister une préparation existante comme un simple ingrédient brut.
-   NE JAMAIS placer un ingrédient de base (ex: "Filet de boeuf", "Sel", "Huile d'olive") dans \`subRecipes\`.

---
## DEMANDE UTILISATEUR

{{#if rawRecipe}}
**Priorité absolue : Reformater la recette brute suivante en respectant TOUTES les règles.**
**La liste d'ingrédients ci-dessous est la SEULE source pour le champ \`ingredients\` de la sortie.**
\`\`\`
{{{rawRecipe}}}
\`\`\`
{{else}}
**Créer une nouvelle fiche technique en respectant TOUTES les règles.**
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
- **VALEUR IMPÉRATIVE POUR LE CHAMP \`type\` : La valeur du champ \`type\` doit OBLIGATOIREMENT être "Plat".**
- **Ceci est un PLAT.** Remplissez tous les champs demandés, en particulier \`name\`, \`description\`, \`portions\`, \`category\`, et \`commercialArgument\`.
- Le champ \`category\` DOIT correspondre à une des catégories de la liste fournie.
- Si le nom n'est pas fourni, générez-en un qui soit créatif et vendeur.
- La procédure de fabrication (\`procedure_fabrication\`) doit être claire, chronologique et utiliser le format Markdown.
- La procédure de service/dressage (\`procedure_service\`) doit être claire, concise et utiliser le format Markdown.
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

        // 3. Generate an image for the dish
        let imageUrl = `https://placehold.co/1024x768/fafafa/7d7d7d.png?text=${encodeURIComponent(recipeConcept.name)}`;

        try {
            // La config est implicite via les variables d'env, on vérifie juste qu'elles existent.
            if (process.env.CLOUDINARY_API_KEY) {
                const imagePrompt = `Photographie culinaire professionnelle, style magazine gastronomique. Plat : "${recipeConcept.name}". Description : "${recipeConcept.description}". Dressage : "${recipeConcept.procedure_service}". Éclairage de studio, faible profondeur de champ, assiette élégante.`;

                const { media } = await ai.generate({
                    model: googleAI.model('imagen-4.0-fast-generate-001'),
                    prompt: imagePrompt,
                });

                if (media?.url) {
                    const uploadResult = await cloudinary.uploader.upload(media.url, {
                        folder: "le-singulier-ai-generated",
                        resource_type: "image",
                    });
                    imageUrl = uploadResult.secure_url;
                }
            } else {
                console.warn("Cloudinary API Key non trouvée, utilisation d'une image placeholder.");
            }
        } catch (error) {
            console.error("Erreur de génération/téléversement d'image, utilisation du placeholder.", error);
        }
        finalOutput.imageUrl = imageUrl;
        

        return finalOutput;
    }
);

// Main exported function
export async function generateRecipeConcept(input: RecipeConceptInput): Promise<RecipeConceptOutput> {
    return generateRecipeConceptFlow(input);
}
