
'use server';

import { runMenuAnalysis, type AnalysisInput, type AIResults } from '@/ai/flows/menu-analysis-flow';

export async function getAIRecommendations(input: AnalysisInput): Promise<AIResults | {error: string}> {
    try {
        const result = await runMenuAnalysis(input);
        return result;

    } catch (e) {
        console.error("Error getting AI recommendations:", e);
        if (e instanceof Error) {
            return { error: `Erreur lors de l'analyse par l'IA : ${e.message}`};
        }
        return { error: "Une erreur inconnue est survenue lors de l'analyse par l'IA."};
    }
}
