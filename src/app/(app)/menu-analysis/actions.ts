
'use server';

import { menuAnalysisFlow } from '@/ai/flows/menu-analysis-flow';
import type { SummaryData, ProductionData, MutualisationData, PlanningTask } from './page';

type AnalysisInput = {
    summary: SummaryData;
    production: ProductionData[];
    mutualisations: MutualisationData[];
}

type AIResults = {
    recommandations: string;
    planning: PlanningTask[];
}

export async function getAIRecommendations(input: AnalysisInput): Promise<AIResults | {error: string}> {
    try {
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
