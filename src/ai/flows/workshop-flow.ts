
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes.
 * - generateDishConcept: Génère un concept complet de plat (recette + image) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';

// La configuration est déjà présente, assurons-nous que les variables d'env sont chargées
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const DishConceptInputSchema = z.object({
    dishName: z.string().optional().describe("Le nom ou l'idée de base du plat. Peut être vide."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style, la saisonnalité, ou le type de cuisine souhaité."),
    rawRecipe: z.string().optional().describe("Une recette complète en texte brut à reformater. Si ce champ est fourni, l'IA doit l'utiliser comme source principale et ignorer les autres champs d'instructions."),
    refinementHistory: z.array(z.string()).optional().describe("L'historique des instructions d'affinage précédentes. L'IA doit respecter toutes ces contraintes passées."),
    currentRefinement: z.string().optional().describe("La nouvelle instruction d'affinage à appliquer par-dessus l'historique."),
});
export type DishConceptInput = z.infer<typeof DishConceptInputSchema>;

const DishConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final et marketing du plat."),
    description: z.string().describe("Une description alléchante et créative du plat."),
    ingredients: z.array(z.object({
        name: z.string().describe("Le nom de l'ingrédient."),
        quantity: z.number().describe("La quantité nécessaire."),
        unit: z.string().describe("L'unité de mesure (ex: g, kg, ml, l, pièce).")
    })).describe("La liste des ingrédients pour la recette, avec quantités."),
    subRecipes: z.array(z.string()).describe("La liste des noms des sous-recettes EXISTANTES (qui étaient dans la liste fournie par l'outil) utilisées dans ce plat."),
    newSubRecipes: z.array(z.object({
        name: z.string().describe("Le nom de la NOUVELLE préparation que l'IA a dû créer car elle n'était pas dans la liste des préparations existantes."),
        description: z.string().describe("Une courte description de ce qu'est cette nouvelle préparation."),
    })).describe("La liste des NOUVELLES préparations que l'IA a dû inventer pour cette recette."),
    procedure_preparation: z.string().describe("Les étapes détaillées de la phase de préparation (mise en place). Doit être formaté en Markdown."),
    procedure_cuisson: z.string().describe("Les étapes détaillées de la phase de cuisson. Doit être formaté en Markdown."),
    procedure_service: z.string().describe("Les étapes détaillées pour le service et le dressage artistique. Doit être formaté en Markdown."),
    duration: z.number().int().describe("La durée totale de préparation en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Le niveau de difficulté de la recette."),
    portions: z.number().int().describe("Le nombre de portions que la recette produit."),
    commercialArgument: z.string().describe("Un argumentaire commercial court et percutant pour le plat."),
    imageUrl: z.string().url().describe("L'URL d'une image générée représentant le plat final."),
});
export type DishConceptOutput = z.infer<typeof DishConceptOutputSchema>;


// Fonction exportée principale
export async function generateDishConcept(input: DishConceptInput): Promise<DishConceptOutput> {
    return generateDishConceptFlow(input);
}


// Définition du prompt pour la génération de la recette textuelle
const recipeConceptPrompt = ai.definePrompt({
    name: 'recipeConceptPrompt',
    input: { schema: DishConceptInputSchema },
    // On enlève imageUrl car ce prompt ne génère que le texte
    output: { schema: DishConceptOutputSchema.omit({ imageUrl: true }) }, 
    tools: [getAvailablePreparationsTool],
    prompt: `
        Vous êtes un chef cuisinier créatif et un styliste culinaire de renommée mondiale, chargé de créer une fiche technique quasi-complète pour un nouveau plat.
        Votre mission est de transformer une idée brute ou une recette existante en un concept de plat professionnel, inspirant et structuré, adapté à un usage en restaurant.

        Pour déterminer quelles préparations de base peuvent être utilisées, vous devez OBLIGATOIREMENT utiliser l'outil \`getAvailablePreparations\`. La liste retournée par cet outil est la SEULE source de vérité des préparations existantes.

        **Règles de gestion des sous-recettes (préparations) - TRÈS IMPORTANT :**
        1.  Si une préparation nécessaire pour la recette existe dans la liste fournie par l'outil, vous devez l'ajouter au tableau \`subRecipes\`.
        2.  **Règle de discernement CRUCIALE et IMPÉRATIVE :** Une préparation ne doit être listée dans \`newSubRecipes\` que si elle représente une VRAIE préparation de base, complexe, qui a un intérêt à être stockée et réutilisée dans d'autres plats.
            -   **EXEMPLES DE BONNES NOUVELLES PRÉPARATIONS :** "Fond de veau", "Sauce hollandaise", "Pâte brisée", "Confit d'oignons", "Garniture duxelles". Ce sont des bases réutilisables.
            -   **EXEMPLES DE MAUVAISES NOUVELLES PRÉPARATIONS (À NE PAS FAIRE) :** "Sauce à la crème pour poulet", "Sauce minute au poivre", "Garniture de légumes rôtis". Ce sont des assemblages simples faits pour le plat.
        3.  **Si une sauce, une vinaigrette, un jus ou une garniture est simple et fait "à la minute" dans le cadre de la recette du plat, ses ingrédients doivent être listés dans le tableau \`ingredients\` principal et ses étapes intégrées directement dans la \`procedure\`. Ne la déclarez JAMAIS comme une nouvelle sous-recette.**
        4.  Les ingrédients et étapes des NOUVELLES préparations (celles listées dans \`newSubRecipes\`) ne doivent PAS être détaillés dans la procédure du plat principal. La procédure doit simplement mentionner "utiliser la Sauce X".

        {{#if rawRecipe}}
        PRIORITÉ ABSOLUE : Votre mission principale est de prendre la recette brute suivante, de l'analyser, et de la reformater pour remplir TOUS les champs de la fiche technique demandée. Ignorez les autres instructions de création.
        RECETTE BRUTE À REFORMATER :
        ---
        {{{rawRecipe}}}
        ---
        {{else}}
        Voici les instructions du chef de l'établissement pour une NOUVELLE création :
        {{#if dishName}}- Le nom du plat est imposé : {{{dishName}}}. Vous devez le conserver.{{else}}- Pour une carte gastronomique, un intitulé clair, sobre et précis inspire plus confiance que des noms trop lyriques. Le nom doit mettre en avant le produit principal et son accompagnement le plus significatif, pas une liste. Exemple : "Noix de Saint-Jacques justes snackées, mousseline de chou-fleur à la noisette". Mauvais exemple : "Symphonie marine et son trésor des champs".{{/if}}
        {{#if mainIngredients}}- Ingrédients à utiliser : {{{mainIngredients}}}{{else}}- Ingrédients principaux: Vous avez carte blanche pour les choisir. Soyez créatif.{{/if}}
        {{#if excludedIngredients}}- Ingrédients à **ABSOLUMENT EXCLURE** : {{{excludedIngredients}}}{{/if}}
        {{#if recommendations}}- Recommandations et style : {{{recommendations}}}{{/if}}
        {{/if}}
        
        {{#if refinementHistory}}
        - **HISTORIQUE DES MODIFICATIONS PRÉCÉDENTES :** Vous devez impérativement continuer à respecter TOUTES les contraintes suivantes, qui ont été demandées lors des étapes précédentes.
        {{#each refinementHistory}}
            - "{{{this}}}"
        {{/each}}
        {{/if}}

        {{#if currentRefinement}}
        - **NOUVELLE INSTRUCTION D'AFFINAGE :** Par-dessus tout ce qui a été dit, appliquez maintenant cette nouvelle modification : "{{{currentRefinement}}}"
        {{else}}
            {{#if refinementHistory}}
            - Aucune nouvelle instruction pour cette étape. Vous devez simplement régénérer une proposition cohérente avec l'historique des demandes.
            {{/if}}
        {{/if}}


        Votre tâche est de générer une fiche technique détaillée avec les éléments suivants :
        1.  **name**: {{#if dishName}}Conservez impérativement le nom "{{{dishName}}}".{{else}}Inventez un nom de plat. Pour une carte gastronomique, un intitulé clair, sobre et précis inspire plus confiance que des noms trop lyriques. Le nom doit mettre en avant le produit principal et son accompagnement le plus significatif, pas une liste. Exemple : "Noix de Saint-Jacques justes snackées, mousseline de chou-fleur à la noisette". Mauvais exemple : "Symphonie marine et son trésor des champs".{{/if}}
        2.  **description**: Une description courte, poétique et alléchante qui met l'eau à la bouche.
        3.  **ingredients**: Une liste de TOUS les ingrédients bruts nécessaires pour réaliser l'assemblage final du plat. Règle impérative : **privilégiez systématiquement les unités de poids (grammes, kg) pour les viandes, poissons, et la plupart des légumes, plutôt que "pièce" ou "unité".** Réservez "pièce" uniquement lorsque c'est indispensable (ex: 1 œuf). N'incluez PAS ici les ingrédients des sous-recettes (existantes ou nouvelles).
        4.  **subRecipes**: Listez ici UNIQUEMENT les noms des préparations de la recette qui correspondent EXACTEMENT à un nom dans la liste des préparations disponibles que vous avez récupérées via l'outil.
        5.  **newSubRecipes**: Listez ici les NOUVELLES préparations que vous avez inventées (selon la règle de discernement IMPÉRATIVE) car elles n'étaient pas dans la liste de l'outil. Chaque élément doit avoir un nom et une description.
        6.  **procedure_preparation**: Les étapes claires pour la mise en place et l'assemblage. Mentionnez l'utilisation des sous-recettes (ex: "Préparer la sauce bolognaise comme indiqué sur sa fiche."). Utilisez le format Markdown (titres avec '###', listes avec '-', sous-listes).
        7.  **procedure_cuisson**: Les étapes techniques pour la cuisson de l'assemblage. Utilisez le format Markdown. Si le plat est cru, indiquez "Aucune cuisson nécessaire.".
        8.  **procedure_service**: Les instructions de dressage précises pour une assiette spectaculaire. Utilisez le format Markdown. Par exemple: "### Dressage\\n1. Déposer la purée...\\n2. Placer le poisson..."
        9.  **duration**: Estimez la durée totale de préparation en minutes (nombre entier).
        10. **difficulty**: Évaluez la difficulté de la recette ('Facile', 'Moyen', 'Difficile').
        11. **portions**: Estimez le nombre de portions que cette recette produit (ex: 1, 2, 4...).
        12. **commercialArgument**: Rédigez un argumentaire de vente court, percutant et savoureux pour convaincre un client de choisir ce plat.

        Soyez créatif, audacieux et respectez les contraintes à la lettre. Fournissez une réponse structurée au format JSON.
    `,
});

// Le flow principal qui orchestre la génération de texte et d'image
const generateDishConceptFlow = ai.defineFlow(
    {
        name: 'generateDishConceptFlow',
        inputSchema: DishConceptInputSchema,
        outputSchema: DishConceptOutputSchema,
    },
    async (input) => {
        // 1. Générer le concept textuel de la recette
        const { output: recipeConcept } = await recipeConceptPrompt(input);

        if (!recipeConcept) {
            throw new Error("La génération du concept de la recette a échoué.");
        }

        let imageUrl = `https://placehold.co/1024x768/fafafa/7d7d7d.png?text=${encodeURIComponent(recipeConcept.name)}`; // Image de substitution par défaut

        try {
            // 2. Créer un prompt pour l'image basé sur la recette générée
            const imagePrompt = `
                Photographie culinaire professionnelle et ultra-réaliste, style magazine gastronomique.
                Plat : "${recipeConcept.name}".
                Description : "${recipeConcept.description}".
                Dressage : "${recipeConcept.procedure_service}".
                L'assiette est dressée de manière artistique sur une table élégante. Éclairage de studio, faible profondeur de champ, détails nets et couleurs vibrantes.
            `;

            // 3. Essayer de générer l'image avec le modèle approprié
            const { media } = await ai.generate({
                model: 'googleai/imagen-4.0-fast-generate-001',
                prompt: imagePrompt,
            });
            
            if (media && media.url) {
                // 4. Téléverser l'image sur Cloudinary
                const uploadResult = await cloudinary.uploader.upload(media.url, {
                    folder: "le-singulier-ai-generated",
                    resource_type: "image",
                });
                imageUrl = uploadResult.secure_url;
            } else {
                console.warn("La génération de l'image a retourné une réponse vide, utilisation de l'image de substitution.");
            }
        } catch (error) {
            // Si la génération d'image ou le téléversement échoue, on log l'erreur mais on ne bloque pas le processus.
            console.error("Erreur lors de la génération ou du téléversement de l'image, utilisation de l'image de substitution.", error);
        }


        // 5. Combiner le texte et l'URL de l'image (réelle ou de substitution) dans la sortie finale
        return {
            ...recipeConcept,
            imageUrl: imageUrl,
        };
    }
);
