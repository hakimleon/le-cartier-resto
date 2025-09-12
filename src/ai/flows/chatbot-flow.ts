
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
  async (messages) => {
    
    const model = 'googleai/gemini-1.5-flash-latest';
    
    // Extrait le dernier message comme prompt
    const lastMessage = messages.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error("Le dernier message doit provenir de l'utilisateur.");
    }
    const prompt = lastMessage.content;

    // Utilise les messages précédents comme historique
    const history = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      content: [{ text: msg.content }],
    }));
    
    const result = await ai.generate({
      model,
      prompt: prompt,
      history: history,
    });
    
    return { content: result.text };
  }
);
