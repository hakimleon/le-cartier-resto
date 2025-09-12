
'use server';
/**
 * @fileOverview Flux Genkit pour l'assistant conversationnel.
 * - chatbotFlow: Gère la conversation avec l'historique et les outils.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message, partSchema } from 'genkit';

const ChatbotInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.array(partSchema),
  })).optional().describe("L'historique des messages de la conversation."),
  prompt: z.string().describe("La dernière question ou instruction de l'utilisateur."),
});

const ChatbotOutputSchema = z.object({
  response: z.string().describe("La réponse de l'assistant."),
});

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async ({ history, prompt }) => {
    
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      history: history as Message[],
      // Les outils sont temporairement retirés pour le test de mémoire
      // tools: [searchMenuTool, getAvailablePreparationsTool],
    });

    const responseText = llmResponse.text;
    
    return { response: responseText };
  }
);
