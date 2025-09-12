'use server';
/**
 * @fileOverview Flux Genkit pour l'assistant conversationnel.
 * - chatbotFlow: Gère la conversation avec l'historique et les outils.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message, partSchema } from 'genkit';
import { searchMenuTool } from '../tools/menu-tools';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';

const ChatbotInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(partSchema),
  })).describe("L'historique complet des messages de la conversation, y compris le dernier message de l'utilisateur."),
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
  async ({ messages }) => {
    
    // Le dernier message est le prompt, le reste est l'historique.
    const history = messages.slice(0, -1) as Message[];
    const prompt = messages[messages.length - 1].content[0].text || '';

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      history: history,
      tools: [searchMenuTool, getAvailablePreparationsTool],
    });

    const responseText = llmResponse.text;
    
    return { response: responseText };
  }
);
