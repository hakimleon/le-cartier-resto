
'use server';

import { menuAnalysisFlow } from '@/ai/flows/menu-analysis-flow';
import type { AnalysisInput, AIResults } from '@/ai/flows/menu-analysis-flow';


export async function getAIRecommendations(input: AnalysisInput): Promise<AIResults | {error: string}> {
    try {
        // The flow now returns the new structure directly.
        const result = await menuAnalysisFlow(input);
        return result;

    } catch (e) {
        console.error("Error getting AI recommendations:", e);
        if (e instanceof Error) {
            return { error: `Erreur lors de l'analyse par l'IA : ${e.message}`};
        }
        return { error: "Une erreur inconnue est survenue lors de l'analyse par l'IA."};
    }
}
