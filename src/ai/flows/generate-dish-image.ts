'use server';
/**
 * @fileOverview AI-powered dish image generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDishImageInputSchema = z.object({
  prompt: z.string().describe('A detailed prompt to generate the dish image, e.g., "A gourmet burger with a glossy brioche bun, a thick beef patty with melted cheddar cheese, fresh lettuce, and a side of crispy golden fries on a rustic wooden board."'),
});
export type GenerateDishImageInput = z.infer<typeof GenerateDishImageInputSchema>;

// The output is just a string, which will be the data URI of the generated image.
const GenerateDishImageOutputSchema = z.string();
export type GenerateDishImageOutput = z.infer<typeof GenerateDishImageOutputSchema>;

export async function generateDishImage(input: GenerateDishImageInput): Promise<GenerateDishImageOutput> {
  return generateDishImageFlow(input);
}

const generateDishImageFlow = ai.defineFlow(
  {
    name: 'generateDishImageFlow',
    inputSchema: GenerateDishImageInputSchema,
    outputSchema: GenerateDishImageOutputSchema,
  },
  async ({ prompt }) => {
    // Enhance the prompt for better image quality and style
    const fullPrompt = `${prompt}, food photography, professional, high-quality, photorealistic, delicious, appetizing`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: fullPrompt,
      config: {
        // Must provide both TEXT and IMAGE, IMAGE only won't work
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
      throw new Error('Image generation failed to return a media URL.');
    }

    // The URL is already a base64 data URI
    return media.url;
  }
);
