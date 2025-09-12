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

    // Take the last message from the user as the main prompt.
    const lastUserMessage = history.pop();
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
        throw new Error("Le dernier message doit être de l'utilisateur.");
    }
    
    // The rest of the array is the chat history.
    // We need to map the roles to what the model expects ('assistant' -> 'model').
    const result = await ai.generate({
      model,
      prompt: lastUserMessage.content,
      history: history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
          content: [{ text: msg.content }],
        })),
    });
    
    return { content: result.text() };
  }
);
