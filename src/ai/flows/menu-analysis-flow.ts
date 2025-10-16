
'use server';
/**
 * @fileOverview Flow Genkit pour l'analyse stratégique du menu.
 * - menuAnalysisFlow: Reçoit les données d'analyse et demande des recommandations à l'IA.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Schémas Zod pour valider les entrées du flow.
const SummaryDataSchema = z.object({
    totalDishes: z.number(),
    averageDuration: z.number(),
    categoryCount: z.record(z.number()),
});

const ProductionDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    duration: z.number(),
    duration_breakdown: z.object({
        mise_en_place: z.number(),
        cuisson: z.number(),
        envoi: z.number(),
    }),
    foodCost: z.number(),
    grossMargin: z.number(),
    yieldPerMin: z.number(),
    price: z.number(),
});

const MutualisationDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    dishCount: z.number(),
    dishes: z.array(z.string()),
    frequency: z.string(),
});

const AnalysisInputSchema = z.object({
    summary: SummaryDataSchema.describe("Résumé général du menu."),
    production: z.array(ProductionDataSchema).describe("Données de production et de rentabilité pour chaque plat."),
    mutualisations: z.array(MutualisationDataSchema).describe("Liste des préparations communes à plusieurs plats."),
});

// Schéma pour le planning
const PlanningTaskSchema = z.object({
  heure: z.string().describe("L'heure de début de la tâche (ex: '08:00')."),
  poste: z.string().describe("Le poste de cuisine assigné (ex: 'Chaud', 'Garde-manger', 'Pâtisserie')."),
  tache: z.string().describe("La description de la tâche à effectuer."),
  duree: z.number().describe("La durée estimée en minutes."),
  priorite: z.number().describe("Le niveau de priorité (1=Haute, 2=Moyenne, 3=Basse).")
});


// Schéma de la sortie attendue de l'IA
const AIOutputSchema = z.object({
    recommandations: z.string().describe("Les recommandations stratégiques textuelles au format Markdown."),
    planning: z.array(PlanningTaskSchema).describe("Le planning de production horaire.")
});


const analysisPrompt = ai.definePrompt({
    name: 'menuAnalysisPrompt',
    input: { schema: AnalysisInputSchema },
    output: { schema: AIOutputSchema },
    model: googleAI.model('gemini-1.5-pro'),
    config: {
        temperature: 0.2,
    },
    prompt: `SYSTEM: Tu es un consultant expert en performance de restaurants, spécialisé dans l'analyse de données. Ta mission est d'analyser en profondeur le JSON fourni et de générer des recommandations UNIQUEMENT basées sur ces données. NE PAS donner de conseils génériques.

CONTEXTE CULINAIRE IMPORTANT :
- Chaque plat peut avoir un champ "mode_preparation" qui peut être "avance", "minute" ou "mixte". Ce champ est crucial.
- Tâches 'avance' (ex: "Préparation des Fonds", "Mijotage long"): Ce sont des tâches à faible intensité qui peuvent souvent se dérouler en arrière-plan. Elles occupent un poste mais ne demandent pas une attention constante. Ne les considérez pas comme un bloqueur total pour le poste.
- Tâches 'mixte' : Une partie est faite à l'avance, l'autre pendant le service.
- Tâches 'minute' (ex: "Cuisson du steak"): Ce sont des tâches courtes et intenses qui se produisent souvent juste avant ou pendant le service.

EXEMPLE D'ANALYSE ATTENDUE:
Si tu vois un plat avec un "yieldPerMin" très bas et un "duration" très haut, tu dois le mentionner et proposer une solution.
Si tu vois une préparation utilisée dans 8 plats différents ("dishCount": 8), tu dois recommander de la produire en grande quantité.
Si tu vois que 80% des plats utilisent le poste "Chaud", tu dois signaler un risque de goulot d'étranglement, en tenant compte du type de tâches (actives vs. de fond).

INSTRUCTIONS IMPÉRATIVES:
1.  **BASE-TOI EXCLUSIVEMENT SUR LES DONNÉES FOURNIES**: Tes recommandations DOIVENT faire référence à des noms de plats, des chiffres, ou des tendances présents dans le JSON en entrée.
2.  **FORMAT DE SORTIE**: Tu DOIS retourner un objet JSON avec EXACTEMENT deux clés : "planning" et "recommandations".
3.  **CONTENU "recommandations"**:
    - Identifie **3 priorités opérationnelles** basées sur les plus grands points de friction que tu vois dans les données (ex: plat le plus long, préparation la plus utilisée, marge la plus faible).
    - Propose **3 idées de réingénierie de plats** concrets, en nommant les plats et en expliquant le problème (ex: \`Le plat 'XYZ' a une marge de -50 DZD\`) et la solution.
4.  **CONTENU "planning"**: Génère un planning de production logique basé sur les durées et les mutualisations. Prends en compte le "mode_preparation" pour ne pas surcharger les postes avec des tâches qui sont en réalité faites en arrière-plan.

Les données du menu de l'utilisateur sont fournies en entrée de ce prompt. Analyse-les.
`,
});


export const menuAnalysisFlow = ai.defineFlow(
    {
        name: 'menuAnalysisFlow',
        inputSchema: AnalysisInputSchema,
        outputSchema: AIOutputSchema,
    },
    async (input) => {
        const { output } = await analysisPrompt(input);
         if (!output) {
            throw new Error("L'IA n'a pas pu générer une réponse valide.");
        }
        return output;
    }
);
