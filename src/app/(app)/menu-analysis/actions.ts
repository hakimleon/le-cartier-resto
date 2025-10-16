
'use server';

import { menuAnalysisFlow } from '@/ai/flows/menu-analysis-flow';
import type { SummaryData, ProductionData, MutualisationData } from './page';

type AnalysisInput = {
    summary: SummaryData;
    production: ProductionData[];
    mutualisations: MutualisationData[];
}

export async function getAIRecommendations(input: AnalysisInput): Promise<string> {
    try {
        const result = await menuAnalysisFlow(input);
        return result;
    } catch (e) {
        console.error("Error getting AI recommendations:", e);
        if (e instanceof Error) {
            return `Erreur lors de l'analyse par l'IA : ${e.message}`;
        }
        return "Une erreur inconnue est survenue lors de l'analyse par l'IA.";
    }
}
