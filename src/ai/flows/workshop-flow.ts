
'use server';
/**
 * @fileOverview Flow pour l'atelier de création de recettes.
 * - generateDishConcept: Génère un concept complet de plat (recette + image) à partir d'instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';

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
    subRecipes: z.array(z.string()).describe("La liste des sous-recettes ou préparations nécessaires (ex: 'Sauce Vierge', 'Fond de veau')."),
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
    output: { schema: DishConceptOutputSchema.omit({ imageUrl: true }) },
    prompt: `
        Vous êtes un chef cuisinier créatif et un styliste culinaire de renommée mondiale, chargé de créer une fiche technique quasi-complète pour un nouveau plat.
        Votre mission est de transformer une idée brute en un concept de plat professionnel, inspirant et structuré, adapté à un usage en restaurant.

        Voici la liste exhaustive et FIGÉE des préparations de base qui peuvent être considérées comme des sous-recettes.
        Si une préparation n'est pas dans cette liste, ses ingrédients et étapes doivent être intégrés directement dans la recette principale.
        LISTE DES PRÉPARATIONS DE BASE AUTORISÉES :
        - Fond de poulet maison
        - Fond de bœuf
        - Fond d’agneau
        - Court-bouillon / fumet de poisson
        - Sauce tomate maison
        - Béchamel
        - Sauce au curry doux
        - Sauce fromagère
        - Sauce champignon / forestière
        - Sauce citronnée légère
        - Mayonnaise maison
        - Vinaigrette maison
        - Pesto basilic
        - Sauce César
        - Sauce au yaourt citronnée / herbes fraîches
        - Purée de pommes de terre maison
        - Purée de céleri au beurre noisette
        - Carottes glacées
        - Légumes grillés / rôtis
        - Riz pilaf / riz safrané
        - Pâtes fraîches
        - Base de tajine
        - Base bolognaise
        - Farce ricotta / herbes
        - Crème de pistache

        Voici les instructions du chef de l'établissement :
        {{#if dishName}}- Le nom du plat est imposé : {{{dishName}}}. Vous devez le conserver.{{else}}- Vous avez carte blanche pour inventer un nom de plat créatif et alléchant.{{/if}}
        {{#if mainIngredients}}- Ingrédients à utiliser : {{{mainIngredients}}}{{else}}- Ingrédients principaux: Vous avez carte blanche pour les choisir. Soyez créatif.{{/if}}
        {{#if excludedIngredients}}- Ingrédients à **ABSOLUMENT EXCLURE** : {{{excludedIngredients}}}{{/if}}
        {{#if recommendations}}- Recommandations et style : {{{recommendations}}}{{/if}}
        
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
        1.  **name**: {{#if dishName}}Conservez impérativement le nom "{{{dishName}}}".{{else}}Inventez un nom marketing et séduisant pour le plat.{{/if}}
        2.  **description**: Une description courte, poétique et alléchante qui met l'eau à la bouche.
        3.  **ingredients**: Une liste de TOUS les ingrédients bruts nécessaires pour réaliser la recette complète. Règle impérative : **privilégiez systématiquement les unités de poids (grammes, kg) pour les viandes, poissons, et la plupart des légumes, plutôt que "pièce" ou "unité".** Réservez "pièce" uniquement lorsque c'est indispensable (ex: 1 œuf). Si une préparation n'est PAS dans la liste des bases autorisées (ex: une garniture simple), ses ingrédients doivent être listés ici.
        4.  **subRecipes**: Listez ici UNIQUEMENT les noms des préparations de la recette qui correspondent EXACTEMENT à un nom dans la LISTE DES PRÉPARations DE BASE AUTORISÉES fournie au début. Si aucune base de la liste n'est utilisée, retournez un tableau vide. C'est un point crucial.
        5.  **procedure_preparation**: Les étapes claires pour la mise en place. Intégrez ici les étapes des préparations qui ne sont PAS dans la liste des bases (ex: vinaigrette minute, purée spécifique, etc.). Utilisez le format Markdown (titres avec '###', listes avec '-', sous-listes).
        6.  **procedure_cuisson**: Les étapes techniques pour la cuisson. Utilisez le format Markdown. Si le plat est cru, indiquez "Aucune cuisson nécessaire.".
        7.  **procedure_service**: Les instructions de dressage précises pour une assiette spectaculaire. Utilisez le format Markdown. Par exemple: "### Dressage\\n1. Déposer la purée...\\n2. Placer le poisson..."
        8.  **duration**: Estimez la durée totale de préparation en minutes (nombre entier).
        9.  **difficulty**: Évaluez la difficulté de la recette ('Facile', 'Moyen', 'Difficile').
        10. **portions**: Estimez le nombre de portions que cette recette produit (ex: 1, 2, 4...).
        11. **commercialArgument**: Rédigez un argumentaire de vente court, percutant et savoureux pour convaincre un client de choisir ce plat.

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

        let imageUrl = "https://picsum.photos/1024/768"; // Image de substitution par défaut

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
                model: 'googleai/gemini-2.5-flash-image-preview',
                prompt: imagePrompt,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                }
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
