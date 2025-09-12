
'use server';
/**
 * @fileOverview Flow simple pour le nouveau Chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatbotInputSchema = z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
        text: z.string(),
    })),
}));

const ChatbotOutputSchema = z.object({
    content: z.string(),
});

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (messages) => {
    
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      history: messages,
      prompt: "Tu es un assistant de restaurant. Réponds à la question de l'utilisateur.",
    });
    
    return { content: result.text };
  }
);
