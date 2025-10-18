
'use server';
/**
 * @fileOverview Flow Genkit pour l'analyse stratégique du menu.
 * - runMenuAnalysis: Reçoit les données d'analyse et demande des recommandations à l'IA.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Schéma Zod pour valider les entrées du flow - Version Simplifiée
const SimplifiedProductionDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    duration: z.number().describe("Charge de travail en service (en minutes)."),
    foodCost: z.number().describe("Coût matière de la portion."),
    grossMargin: z.number().describe("Marge brute par portion."),
    price: z.number().describe("Prix de vente du plat."),
});

export const SimplifiedAnalysisInputSchema = z.object({
    production: z.array(SimplifiedProductionDataSchema).describe("Données de production et de rentabilité pour chaque plat."),
});
export type SimplifiedAnalysisInput = z.infer<typeof SimplifiedAnalysisInputSchema>;


// Schéma de sortie pour l'analyse de plat
const DishAnalysisSchema = z.object({
  id: z.string().describe("L'ID du plat analysé."),
  name: z.string().describe("Le nom du plat analysé."),
  priority: z.enum(['Urgent', 'Moyen', 'Bon']).describe("La priorité d'intervention sur ce plat (Urgent, Moyen, Bon)."),
  suggestion: z.string().describe("La recommandation spécifique pour ce plat (ex: 'Ajuster recette/prix', 'Passer en cuisson sous-vide')."),
  impact: z.string().describe("L'impact attendu de la suggestion (ex: 'Gain de marge', 'Réduction du temps de service').")
});
export type DishAnalysis = z.infer<typeof DishAnalysisSchema>;

// Schéma de la sortie attendue de l'IA (simplifié)
const AIOutputSchema = z.object({
    dish_reengineering: z.array(DishAnalysisSchema).describe("La liste des plats identifiés pour une réingénierie, classés par priorité."),
});
export type AIResults = z.infer<typeof AIOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'menuAnalysisPrompt',
    input: { schema: z.object({ jsonData: z.string() }) },
    output: { schema: AIOutputSchema },
    model: googleAI.model('gemini-2.5-flash'),
    config: {
        temperature: 0.2,
    },
    prompt: `SYSTEM: Tu es un consultant expert en performance de restaurants. Ta mission est d'analyser en profondeur le JSON fourni et de générer un rapport d'optimisation pour les plats.

DONNÉES DU MENU À ANALYSER :
\`\`\`json
{{{jsonData}}}
\`\`\`

CONTEXTE MÉTIER :
- "duration": Représente la charge de travail *pendant le service*. Une durée élevée ici est un point de friction.
- "grossMargin": La marge brute par portion. Une marge faible est un problème.
- "foodCost" et "price": Le rapport entre ces deux valeurs donne le "food cost percentage", un KPI crucial.

INSTRUCTIONS IMPÉRATIVES DE SORTIE :
Tu DOIS retourner un objet JSON avec une unique clé : "dish_reengineering".

1.  **Pour "dish_reengineering"**:
    - Analyse chaque plat dans la section "production" des données.
    - Calcule le "yieldPerMin" (grossMargin / duration) et le "foodCostPercentage" (foodCost / price).
    - Classifie CHAQUE plat selon la priorité d'intervention suivante :
        - 🔴 'Urgent': Marge brute (grossMargin) faible ET/OU rendement (yieldPerMin) très bas. Ce sont tes cibles prioritaires.
        - 🟠 'Moyen': Potentiel d'optimisation (ex: marge correcte mais durée longue, ou rapide mais marge faible).
        - 🟢 'Bon': Plats rentables et rapides. Ce sont tes étoiles, il faut les protéger.
    - Pour chaque plat classé 'Urgent' ou 'Moyen', fournis une "suggestion" d'action claire et concise (ex: "Simplifier la garniture", "Augmenter le prix de 15%", "Réduire le temps de service via une préparation en amont").
    - Remplis le champ "impact" avec le bénéfice attendu (ex: "Réduction du temps de service de 10 min", "Augmentation de la marge de 250 DZD").

Ne te base que sur les données du JSON. Sois précis et orienté action.
`,
});


const menuAnalysisFlow = ai.defineFlow(
    {
        name: 'menuAnalysisFlow',
        inputSchema: SimplifiedAnalysisInputSchema,
        outputSchema: AIOutputSchema,
    },
    async (input) => {
        const { output } = await analysisPrompt({ jsonData: JSON.stringify(input) });
         if (!output) {
            throw new Error("L'IA n'a pas pu générer une réponse valide.");
        }
        return output;
    }
);

// Wrapper asynchrone pour l'exportation
export async function runMenuAnalysis(input: SimplifiedAnalysisInput): Promise<AIResults> {
    return menuAnalysisFlow(input);
}
