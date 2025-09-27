
'use server';
/**
 * @fileOverview Flux de l'assistant chatbot.
 * - chatbotFlow: Gère la conversation et l'utilisation des outils.
 */

import { ai } from '@/ai/genkit';
import { searchForMatchingPreparationsTool } from '../tools/recipe-tools';
import { searchMenuTool } from '../tools/menu-tools';
import { searchInventoryTool } from '../tools/inventory-tools';
import { z } from 'zod';
import { Message, MessageData, HistorySchema } from 'genkit/experimental/ai';
import { googleAI } from '@genkit-ai/googleai';
import { searchGarnishesTool } from '../tools/garnish-tools';

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: z.object({
      history: HistorySchema,
      prompt: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ history, prompt }) => {
    
    const llmHistory = history as MessageData[];

    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      tools: [searchMenuTool, searchForMatchingPreparationsTool, searchInventoryTool, searchGarnishesTool],
      history: llmHistory,
      prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text;
  }
);
