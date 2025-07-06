'use server';
/**
 * @fileOverview AI-powered daily menu generator.
 *
 * - generateDailyMenu - A function that handles the daily menu generation process.
 * - GenerateDailyMenuInput - The input type for the generateDailyMenu function.
 * - GenerateDailyMenuOutput - The return type for the generateDailyMenu function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyMenuInputSchema = z.object({
  theme: z.string().describe('The theme for the daily menu (e.g., "Italian Night", "Autumn Flavors").'),
  constraints: z.string().describe('Any constraints or specific ingredients to use (e.g., "Use salmon and asparagus", "low-cost dishes").'),
});
export type GenerateDailyMenuInput = z.infer<typeof GenerateDailyMenuInputSchema>;

const DishSchema = z.object({
    name: z.string().describe("The name of the dish."),
    description: z.string().describe("A brief, appealing description of the dish."),
});

const GenerateDailyMenuOutputSchema = z.object({
    presentationText: z.string().describe("A short, welcoming text to present the daily menu, to be displayed on a menu board."),
    entree: DishSchema.describe("The starter dish."),
    plat: DishSchema.describe("The main course."),
    dessert: DishSchema.describe("The dessert."),
});
export type GenerateDailyMenuOutput = z.infer<typeof GenerateDailyMenuOutputSchema>;

export async function generateDailyMenu(input: GenerateDailyMenuInput): Promise<GenerateDailyMenuOutput> {
  return generateDailyMenuFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyMenuPrompt',
  input: {schema: GenerateDailyMenuInputSchema},
  output: {schema: GenerateDailyMenuOutputSchema},
  prompt: `You are an expert chef for "Le Singulier", a sophisticated restaurant. Your task is to create a coherent and appealing daily menu (starter, main course, dessert) based on a theme and specific constraints.

The menu should be creative, well-balanced, and sound delicious. Also, write a short, welcoming presentation text for the menu board.

Theme: {{{theme}}}
Constraints: {{{constraints}}}

Generate a JSON object containing 'presentationText', 'entree', 'plat', and 'dessert'. Each dish should have a 'name' and a 'description'.`,
});

const generateDailyMenuFlow = ai.defineFlow(
  {
    name: 'generateDailyMenuFlow',
    inputSchema: GenerateDailyMenuInputSchema,
    outputSchema: GenerateDailyMenuOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
