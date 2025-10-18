
'use server';
/**
 * @fileOverview MOCK IMPLEMENTATION for menu analysis to debug server errors.
 * - runMenuAnalysis: Returns a hardcoded analysis without calling any AI.
 */

import { z } from 'zod';

// Re-defining schemas here for the mock, to have zero external dependencies.
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

const DishAnalysisSchema = z.object({
  id: z.string().describe("L'ID du plat analysé."),
  name: z.string().describe("Le nom du plat analysé."),
  priority: z.enum(['Urgent', 'Moyen', 'Bon']).describe("La priorité d'intervention sur ce plat (Urgent, Moyen, Bon)."),
  suggestion: z.string().describe("La recommandation spécifique pour ce plat (ex: 'Ajuster recette/prix', 'Passer en cuisson sous-vide')."),
  impact: z.string().describe("L'impact attendu de la suggestion (ex: 'Gain de marge', 'Réduction du temps de service').")
});
export type DishAnalysis = z.infer<typeof DishAnalysisSchema>;

const AIOutputSchema = z.object({
    dish_reengineering: z.array(DishAnalysisSchema).describe("La liste des plats identifiés pour une réingénierie, classés par priorité."),
});
export type AIResults = z.infer<typeof AIOutputSchema>;


/**
 * MOCK IMPLEMENTATION of the menu analysis.
 * This function does NOT call any AI. It returns a hardcoded response to test the API route.
 */
export async function runMenuAnalysis(input: SimplifiedAnalysisInput): Promise<AIResults> {
    console.log("--- USING MOCK runMenuAnalysis --- This is a test and does not call AI.");
    
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 250));

    // Create a mock response based on the input
    const mockDishReengineering: DishAnalysis[] = input.production.map((dish, index) => {
        if (index === 0) {
            return {
                id: dish.id,
                name: dish.name,
                priority: 'Urgent',
                suggestion: 'Ceci est une réponse de test. Le plat a été marqué comme "Urgent".',
                impact: 'Impact de test.'
            };
        }
        return {
            id: dish.id,
            name: dish.name,
            priority: 'Bon',
            suggestion: 'Ceci est une réponse de test. Ce plat est excellent.',
            impact: 'Aucun changement requis (test).'
        };
    });

    return {
        dish_reengineering: mockDishReengineering,
    };
}
