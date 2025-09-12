'use server';
/**
 * @fileOverview Flow de l'assistant chatbot, capable d'utiliser des outils.
 * - chatbotFlow: Gère une conversation en utilisant l'historique et un prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchMenuTool } from '../tools/menu-tools';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';
import { MessageData } from 'genkit';

const ChatbotInputSchema = z.object({
  history: z.array(z.custom<MessageData>()),
  prompt: z.string(),
});

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: z.string(),
  },
  async ({ history, prompt }) => {

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      tools: [searchMenuTool, getAvailablePreparationsTool],
      history: history,
      prompt: prompt,
      config: {
        // Température basse pour des réponses plus factuelles basées sur les outils
        temperature: 0.1, 
      }
    });

    return llmResponse.text;
  }
);
