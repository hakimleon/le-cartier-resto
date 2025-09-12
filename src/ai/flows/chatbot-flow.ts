'use server';
/**
 * @fileOverview Flow simple pour le nouveau Chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatbotInputSchema = z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
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
  async (history) => {
    
    const model = 'googleai/gemini-pro';

    const lastUserMessage = history.pop();
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
        throw new Error("Le dernier message doit être de l'utilisateur.");
    }
    
    const result = await ai.generate({
      model,
      prompt: lastUserMessage.content,
      history: history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          content: [{ text: msg.content }],
        })),
    });
    
    return { content: result.text() };
  }
);
