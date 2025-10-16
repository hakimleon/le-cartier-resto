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
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `SYSTEM: Tu es un chef exécutif et manager de production culinaire expert.
Ta mission est d’aider à la gestion quotidienne d’un restaurant bistronomique.
Tu reçois en entrée un JSON structuré contenant les données d'analyse d'un menu.
À partir de ce JSON, tu dois produire un objet JSON unique qui contient des recommandations et un planning.

INSTRUCTIONS:
- Génère un planning horaire (matin/service/veille) assigné par poste (chaud, garde-manger, pâtisserie) pour les tâches de mise en place les plus importantes, en se basant sur les durées et les mutualisations.
- Pour les recommandations, propose 3 priorités opérationnelles et 3 idées concrètes de réingénierie de plats pour améliorer la rentabilité et/ou réduire le temps de production. Formate cette partie en Markdown.
- Retourne UNIQUEMENT un objet JSON valide avec les clés "planning" et "recommandations".

Les données d'analyse du menu de l'utilisateur sont fournies en entrée de ce prompt. Tu dois les utiliser pour effectuer ton analyse.
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
