
'use server';
/**
 * @fileOverview AI-powered dish image generator with customizable options.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// The StyleOptions enum has been moved to DishForm.tsx to avoid exporting it from a "use server" file.
// We will receive the style as a simple string here.
const GenerateDishImageInputSchema = z.object({
  prompt: z.string().describe('A detailed prompt to generate the dish image, e.g., "A gourmet burger with a glossy brioche bun..."'),
  quantity: z.coerce.number().min(1).max(4).default(1).describe('The number of images to generate (1-4).'),
  style: z.string().default('Photographie').describe('The artistic style of the generated image.'),
});
export type GenerateDishImageInput = z.infer<typeof GenerateDishImageInputSchema>;

// The output is now an array of strings (data URIs).
const GenerateDishImageOutputSchema = z.array(z.string());
export type GenerateDishImageOutput = z.infer<typeof GenerateDishImageOutputSchema>;

export async function generateDishImage(input: GenerateDishImageInput): Promise<GenerateDishImageOutput> {
  return generateDishImageFlow(input);
}

const stylePrompts: Record<string, string> = {
    'Photographie': "food photography, professional, high-quality, photorealistic, delicious, appetizing",
    'Aquarelle': "watercolor painting, vibrant, artistic, gentle wash, soft edges",
    'Dessin au fusain': "charcoal drawing, black and white, dramatic lighting, textured, artistic",
    'Art numérique': "digital art, concept art, detailed, fantasy, sharp focus, vibrant colors",
    'Style bande dessinée': "comic book style, bold lines, flat colors, graphic novel art",
};


const generateDishImageFlow = ai.defineFlow(
  {
    name: 'generateDishImageFlow',
    inputSchema: GenerateDishImageInputSchema,
    outputSchema: GenerateDishImageOutputSchema,
  },
  async ({ prompt, quantity, style }) => {
    const generatedUrls: string[] = [];
    
    // Enhance the prompt with the selected style
    const styleEnhancer = stylePrompts[style] || stylePrompts['Photographie'];
    const fullPrompt = `${prompt}, ${styleEnhancer}`;
    
    // Loop to generate the requested number of images sequentially to avoid rate limiting issues.
    for (let i = 0; i < quantity; i++) {
        console.log(`Generating image ${i + 1} of ${quantity} for prompt: ${fullPrompt}`);
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: fullPrompt,
          config: {
            // Must provide both TEXT and IMAGE, IMAGE only won't work
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        if (!media?.url) {
          console.warn(`Image generation failed for iteration ${i + 1}.`);
          continue; // Skip this iteration if image generation fails
        }
        
        generatedUrls.push(media.url);
    }
    
    if (generatedUrls.length === 0) {
        throw new Error('Image generation failed to return any media URLs.');
    }

    // The URL is already a base64 data URI
    return generatedUrls;
  }
);
