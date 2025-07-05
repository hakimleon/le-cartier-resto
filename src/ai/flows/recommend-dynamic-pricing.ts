'use server';

/**
 * @fileOverview Dynamic pricing recommendation flow.
 *
 * - recommendDynamicPricing - A function that handles the dynamic pricing recommendation process.
 * - RecommendDynamicPricingInput - The input type for the recommendDynamicPricing function.
 * - RecommendDynamicPricingOutput - The return type for the recommendDynamicPricing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendDynamicPricingInputSchema = z.object({
  dishName: z.string().describe('The name of the dish.'),
  currentPrice: z.number().describe('The current price of the dish.'),
  demandEstimate: z
    .number()
    .describe('The estimated customer demand for the dish (e.g., low, medium, high).'),
  competitorPrice: z
    .number()
    .describe('The average competitor price for the dish.'),
});
export type RecommendDynamicPricingInput = z.infer<
  typeof RecommendDynamicPricingInputSchema
>;

const RecommendDynamicPricingOutputSchema = z.object({
  shouldIncreasePrice: z
    .boolean()
    .describe(
      'Whether the price should be increased based on demand and competitor pricing.'
    ),
  suggestedPrice: z
    .number()
    .optional()
    .describe('The suggested price for the dish, if applicable.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the price recommendation.'),
});
export type RecommendDynamicPricingOutput = z.infer<
  typeof RecommendDynamicPricingOutputSchema
>;

export async function recommendDynamicPricing(
  input: RecommendDynamicPricingInput
): Promise<RecommendDynamicPricingOutput> {
  return recommendDynamicPricingFlow(input);
}

const recommendDynamicPricingPrompt = ai.definePrompt({
  name: 'recommendDynamicPricingPrompt',
  input: {schema: RecommendDynamicPricingInputSchema},
  output: {schema: RecommendDynamicPricingOutputSchema},
  prompt: `You are a pricing expert for restaurants. Analyze the demand and competitor pricing to recommend an optimal price for the dish.

Dish Name: {{{dishName}}}
Current Price: {{{currentPrice}}}
Demand Estimate: {{{demandEstimate}}}
Competitor Price: {{{competitorPrice}}}

Consider these factors when making your recommendation:
- If demand is high and your price is lower than competitors, recommend increasing the price.
- Provide a suggested price if a price increase is recommended.
- Explain your reasoning for the recommendation.

Output a JSON object with 'shouldIncreasePrice', 'suggestedPrice' (if applicable) and 'reasoning' fields.`,
});

const recommendDynamicPricingFlow = ai.defineFlow(
  {
    name: 'recommendDynamicPricingFlow',
    inputSchema: RecommendDynamicPricingInputSchema,
    outputSchema: RecommendDynamicPricingOutputSchema,
  },
  async input => {
    const {output} = await recommendDynamicPricingPrompt(input);
    return output!;
  }
);
