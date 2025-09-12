'use server';
/**
 * @fileOverview Flux Genkit pour l'assistant conversationnel.
 * - chatbotFlow: Gère une simple interaction question-réponse sans mémoire.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchMenuTool } from '../tools/menu-tools';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';

// Le schéma d'entrée n'accepte plus qu'un simple prompt (chaîne de caractères)
const ChatbotInputSchema = z.object({
  prompt: z.string().describe("La question de l'utilisateur."),
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
  async ({ prompt }) => {
    
    // L'appel à `ai.generate` est simplifié, sans le paramètre `history`
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      tools: [searchMenuTool, getAvailablePreparationsTool],
    });

    const responseText = llmResponse.text;
    
    return { response: responseText };
  }
);
