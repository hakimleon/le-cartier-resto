
'use server';
/**
 * @fileOverview Flow pour l'assistant IA, maintenant avec des outils.
 */

import { ai } from '@/ai/genkit';
import { getRecipesTool } from '../tools/assistant-tools';
import { z } from 'zod';

const AssistantInputSchema = z.array(z.object({
    role: z.enum(['user', 'model', 'system', 'tool']),
    content: z.array(z.object({
        text: z.string().optional(),
        media: z.object({
            contentType: z.string(),
            url: z.string(),
        }).optional(),
        toolRequest: z.any().optional(),
        toolResponse: z.any().optional(),
    })),
}));

const AssistantOutputSchema = z.object({
    content: z.string(),
});

const systemPrompt = `Tu es un assistant expert pour un restaurateur utilisant l'application "Le Singulier". 
Tu dois répondre aux questions de l'utilisateur sur son restaurant.
Si tu as besoin de connaître les plats du menu pour répondre à une question, utilise l'outil 'getRecipes'.
Ne réponds que sur la base des informations que tu peux obtenir, sinon dis que tu ne sais pas.
Sois concis et direct.`;

export const assistantChatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (messages) => {

    const systemInstruction = {
        role: 'system' as const,
        content: [{ text: systemPrompt }]
    };

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      history: [systemInstruction, ...messages],
      tools: [getRecipesTool],
    });
    
    return { content: result.text };
  }
);
