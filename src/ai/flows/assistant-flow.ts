
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
import { Message, MessageData } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { searchGarnishesTool } from '../tools/garnish-tools';

// Schéma pour l'historique des messages, conforme à Genkit
const HistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.array(
      z.object({
        text: z.string(),
      })
    ),
  })
);

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: z.object({
      history: HistorySchema,
      prompt: z.string(),
      cacheBuster: z.number().optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ history, prompt }) => {
    // Valide l'historique pour s'assurer qu'il est conforme au type Message[]
    const validatedHistory = HistorySchema.parse(history) as MessageData[];

    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      tools: [searchMenuTool, searchForMatchingPreparationsTool, searchInventoryTool, searchGarnishesTool],
      history: validatedHistory,
      prompt: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text;
  }
);
