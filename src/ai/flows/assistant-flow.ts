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
    role: z.enum(['user', 'model', 'tool']),
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
    
    // Sépare le dernier message (le prompt) du reste de l'historique.
    const history = messages.slice(0, -1) as Message[];
    const lastMessage = messages[messages.length - 1];
    
    // Assure que le prompt est bien un texte. Les outils ne sont pas des prompts.
    if (lastMessage.role !== 'user') {
      return { response: "Je ne peux pas traiter une réponse d'outil comme une nouvelle question." };
    }
    const promptText = lastMessage.content[0]?.text || '';

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: promptText,
      history: history,
      tools: [searchMenuTool, getAvailablePreparationsTool],
    });

    const responseText = llmResponse.text;
    
    return { response: responseText };
  }
);
