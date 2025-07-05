// src/ai/flows/optimize-menu-suggestions.ts
'use server';

/**
 * @fileOverview AI-powered menu suggestion tool that suggests menu optimizations
 * based on available ingredients, predicted customer demand, and current trends.
 *
 * - optimizeMenuSuggestions - A function that handles the menu optimization process.
 * - OptimizeMenuSuggestionsInput - The input type for the optimizeMenuSuggestions function.
 * - OptimizeMenuSuggestionsOutput - The return type for the optimizeMenuSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeMenuSuggestionsInputSchema = z.object({
  availableIngredients: z
    .string()
    .describe('A list of available ingredients in the kitchen.'),
  predictedDemand: z
    .string()
    .describe('Predicted customer demand for different dishes.'),
  currentTrends: z.string().describe('Current culinary trends.'),
});
export type OptimizeMenuSuggestionsInput = z.infer<
  typeof OptimizeMenuSuggestionsInputSchema
>;

const OptimizeMenuSuggestionsOutputSchema = z.object({
  menuSuggestions: z
    .string()
    .describe('Suggested menu optimizations based on the input data.'),
  rationale: z
    .string()
    .describe('The rationale behind the menu suggestions.'),
});
export type OptimizeMenuSuggestionsOutput = z.infer<
  typeof OptimizeMenuSuggestionsOutputSchema
>;

export async function optimizeMenuSuggestions(
  input: OptimizeMenuSuggestionsInput
): Promise<OptimizeMenuSuggestionsOutput> {
  return optimizeMenuSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeMenuSuggestionsPrompt',
  input: {
    schema: OptimizeMenuSuggestionsInputSchema,
  },
  output: {
    schema: OptimizeMenuSuggestionsOutputSchema,
  },
  prompt: `You are a world-class chef and restaurant consultant. Your task is to optimize the menu for "Le Singulier" restaurant based on the following information:

Available Ingredients: {{{availableIngredients}}}
Predicted Customer Demand: {{{predictedDemand}}}
Current Culinary Trends: {{{currentTrends}}}

Consider all these factors and suggest menu optimizations. Include specific dishes to add, remove, or modify. Explain the rationale behind your suggestions, considering profitability, customer satisfaction, and alignment with current trends. Return the results in a json format.
`,
});

const optimizeMenuSuggestionsFlow = ai.defineFlow(
  {
    name: 'optimizeMenuSuggestionsFlow',
    inputSchema: OptimizeMenuSuggestionsInputSchema,
    outputSchema: OptimizeMenuSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
