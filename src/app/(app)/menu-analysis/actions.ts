
'use server';

import { menuAnalysisFlow } from '@/ai/flows/menu-analysis-flow';
import type { SummaryData, ProductionData, MutualisationData, PlanningTask } from './MenuAnalysisClient';


type AnalysisInput = {
    summary: SummaryData;
    production: ProductionData[];
    mutualisations: MutualisationData[];
}

type DishReengineering = {
  id: string;
  name: string;
  priority: 'Urgent' | 'Moyen' | 'Bon';
  suggestion: string;
  impact: string;
}

type AIResults = {
    strategic_recommendations: string;
    dish_reengineering: DishReengineering[];
    production_planning_suggestions: PlanningTask[];
}

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
