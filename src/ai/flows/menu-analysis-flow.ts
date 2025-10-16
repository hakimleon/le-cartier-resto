
'use server';
/**
 * @fileOverview Flow Genkit pour l'analyse stratégique du menu.
 * - menuAnalysisFlow: Reçoit les données d'analyse et demande des recommandations à l'IA.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Schémas Zod pour valider les entrées du flow.
// Ils doivent correspondre aux types exportés depuis la page d'analyse.

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


const analysisPrompt = ai.definePrompt({
    name: 'menuAnalysisPrompt',
    input: { schema: z.object({ data: z.string() }) },
    output: { format: 'markdown'},
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `SYSTEM: Tu es un chef exécutif et consultant en restauration, expert en optimisation de menus. Reçois ce JSON contenant l'analyse complète d'une carte. Ta mission est de fournir des recommandations stratégiques CLAIRES, CONCISES et ACTIONNABLES sous forme de texte en Markdown.

INSTRUCTIONS:
1.  **Analyse les données fournies** : summary, production, et mutualisations.
2.  **Identifie 3 priorités opérationnelles** pour améliorer l'efficacité de la cuisine. Exemples : "Réduire le temps de mise en place du plat le plus long", "Augmenter la production du 'Fond de veau' car il est très utilisé".
3.  **Propose 3 idées de réingénierie de plats**. Pour chaque idée, sois concret. Exemples : "Remplacer la sauce X (longue) par une émulsion Y (rapide)", "Transformer le plat Z en version 'à partager' pour augmenter la marge". L'objectif est d'améliorer la rentabilité ou de réduire le temps de préparation.
4.  **Structure ta réponse en Markdown** avec des titres clairs (###) et des listes à puces. Sois direct et va droit au but. Le chef qui te lit est pressé.

Données d'analyse :
\`\`\`json
{{{data}}}
\`\`\`
`,
});


export const menuAnalysisFlow = ai.defineFlow(
    {
        name: 'menuAnalysisFlow',
        inputSchema: AnalysisInputSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        const response = await analysisPrompt({data: JSON.stringify(input)});
        return response.text;
    }
);
