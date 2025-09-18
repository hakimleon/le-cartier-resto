
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes (plats et préparations).
 * - generateRecipeConcept: Génère un concept complet (recette + image si plat) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { getAllPreparationNames } from '../tools/recipe-tools';
import { googleAI } from '@genkit-ai/googleai';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const RecipeConceptInputSchema = z.object({
    type: z.enum(['Plat', 'Préparation']).describe('Le type de fiche technique à générer.'),
    name: z.string().describe("Le nom ou l'idée de base du plat/préparation."),
    description: z.string().optional().describe("La description du plat/préparation."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style, la saisonnalité, ou le type de cuisine souhaité."),
    rawRecipe: z.string().optional().describe("Une recette complète en texte brut à reformater. Si ce champ est fourni, l'IA doit l'utiliser comme source principale."),
    refinementHistory: z.array(z.string()).optional().describe("L'historique des instructions d'affinage précédentes."),
    currentRefinement: z.string().optional().describe("La nouvelle instruction d'affinage à appliquer."),
    cacheBuster: z.number().optional().describe("Valeur aléatoire pour éviter la mise en cache."),
});
export type RecipeConceptInput = z.infer<typeof RecipeConceptInputSchema>;

const RecipeConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final et marketing de la recette."),
    description: z.string().describe("Une description alléchante et créative."),
    
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
    procedure_service: z.string().describe("Procédure de service/dressage (Markdown)."),
    duration: z.number().int().describe("Durée totale en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Niveau de difficulté."),
    
    category: z.enum(['Entrées froides et chaudes', 'Plats et Grillades', 'Les mets de chez nous', 'Symphonie de pâtes', 'Nos Burgers Bistronomiques', 'Dessert', 'Élixirs & Rafraîchissements']).optional().describe("Catégorie du plat, si applicable."),
    portions: z.number().int().optional().describe("Nombre de portions, si c'est un plat."),
    commercialArgument: z.string().optional().describe("Argumentaire commercial, si c'est un plat."),
    imageUrl: z.string().url().optional().describe("URL de l'image générée, si c'est un plat."),

    productionQuantity: z.number().optional().describe("Quantité totale produite, si c'est une préparation."),
    productionUnit: z.string().optional().describe("Unité de production (kg, l, pièces), si c'est une préparation."),
    usageUnit: z.string().optional().describe("Unité d'utilisation suggérée (g, ml, pièce), si c'est une préparation."),
});
export type RecipeConceptOutput = z.infer<typeof RecipeConceptOutputSchema>;

const RecipeTextConceptSchema = RecipeConceptOutputSchema.omit({ imageUrl: true });


const recipeGenPrompt = ai.definePrompt({
    name: 'recipeWorkshopPrompt',
    input: { schema: RecipeConceptInputSchema.extend({ allPreparationNames: z.array(z.string()) }) },
    output: { schema: RecipeTextConceptSchema },
    model: googleAI.model('gemini-1.5-flash-latest'),
    prompt: `Vous êtes un chef expert créant une fiche technique pour un restaurant. Votre tâche est de structurer une recette en utilisant SYSTÉMATIQUEMENT les préparations de base déjà existantes.

---

## CONTEXTE : NOM DE LA RECETTE EN COURS DE CRÉATION
Le nom de la recette que vous êtes en train de générer est : \`{{{name}}}\`

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

### SUBSTITUTIONS D'ALCOOL AUTOMATIQUES (obligatoires)
- Cognac → Jus de raisin blanc réduit OU bouillon corsé
- Vin rouge → Jus de raisin rouge OU fond brun réduit
- Vin blanc → Jus de pomme OU bouillon de volaille
- Bière → Bouillon + vinaigre doux

---

## MISSION PRINCIPALE : UTILISER LES PRÉPARATIONS DE LA LISTE
Pour chaque composant d'une recette (ex: "fond de veau", "sauce tomate") :

1.  **VÉRIFICATION** : Regardez si un nom dans la "LISTE DES PRÉPARATIONS EXISTANTES" correspond.
2.  **ANALYSE**
    *   **Si un nom correspond ET n'est pas le nom de la recette actuelle** :
        *   Utiliser le nom exact de la liste dans \`subRecipes\`.
        *   Ne PAS inclure ses ingrédients dans \`ingredients\`.
        *   Ne PAS inclure ses étapes dans les procédures.
    *   **Si AUCUN nom ne correspond OU si c'est la recette actuelle** :
        *   Inclure les ingrédients dans la liste \`ingredients\`.
        *   Inclure les étapes dans la procédure.

⚠️ Règle stricte : NE JAMAIS INVENTER de sous-recette qui n'est pas dans la liste fournie.

---

## RÈGLES POUR LES INGRÉDIENTS
1.  **Nom simple** : le nom doit être simple et générique ("Oeuf", "Farine", "Citron").
    *   Exceptions autorisées pour précision : "Jaune d’œuf", "Blanc d’œuf", "Filet de poisson".
2.  **Unités logiques** : "g", "kg", "ml", "l", "pièce".

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

## ÉTAPE DE CONTRÔLE AVANT LA SORTIE JSON
Avant de produire la réponse finale, vous DEVEZ :
1.  Vérifier que le nom de la recette actuelle (\`{{{name}}}\`) n'est PAS dans \`subRecipes\`.
2.  Vérifier qu'aucun ingrédient listé dans \`subRecipes\` n’apparaît dans \`ingredients\`.
3.  Vérifier qu’aucun ingrédient alcoolisé n’est présent.
4.  Vérifier que la liste des ingrédients respecte les règles (noms simples, unités logiques).

⚠️ Si une de ces conditions n’est pas respectée, la sortie est INVALIDE. Vous devez corriger et régénérer jusqu’à obtenir un JSON 100% conforme.

---

## INSTRUCTIONS DE FORMATAGE
- **Pour un Plat :** remplir \`portions\`, \`category\`, \`commercialArgument\`.
- **Pour une Préparation :** remplir \`productionQuantity\`, \`productionUnit\`, \`usageUnit\`.
- **Sortie :** fournir une réponse au format JSON strict.
- Ne laissez aucun champ vide : utilisez \`[]\` ou \`""\` si nécessaire.
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

    
    