
'use server';
/**
 * @fileOverview AI-powered dish image generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDishImageInputSchema = z.object({
  prompt: z.string().describe('A detailed prompt to generate the dish image, e.g., "A gourmet burger with a glossy brioche bun..."'),
});
export type GenerateDishImageInput = z.infer<typeof GenerateDishImageInputSchema>;

// The output is now an array of strings (data URIs).
const GenerateDishImageOutputSchema = z.object({
    imageUrl: z.string().describe("The URL of the generated image, as a data URI."),
});
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
    const fullPrompt = `${prompt}, food photography, professional, high-quality, photorealistic, delicious, appetizing`;
    
    console.log(`Generating image for prompt: ${fullPrompt}`);
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: fullPrompt,
      config: {
        // Must provide both TEXT and IMAGE, IMAGE only won't work
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return any media URLs.');
    }

    return { imageUrl: media.url };
  }
);
