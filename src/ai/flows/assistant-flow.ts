
'use server';
/**
 * @fileOverview Flux de l'assistant chatbot.
 * - chatbotFlow: Gère la conversation et l'utilisation des outils.
 */

import { ai } from '@/ai/genkit';
import { searchForMatchingPreparationsTool } from '../tools/recipe-tools';
import { searchMenuTool } from '../tools/menu-tools';
import { z } from 'zod';
import { Message } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

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
    }),
    outputSchema: z.string(),
  },
  async ({ history, prompt }) => {
    // Code de test suggéré par l'utilisateur
    const response = await ai.generate({
      model: "googleai/gemini-1.5-flash",
      prompt: "Écris-moi une blague en français",
    });

    return response.text;
  }
);
