
'use server';
/**
 * @fileOverview Flow simple pour le nouveau Chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatbotOutputSchema = z.object({
    content: z.string(),
});

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: z.string(), // Le flow attend maintenant une simple chaîne de caractères
    outputSchema: ChatbotOutputSchema,
  },
  async (prompt) => {
    
    const model = 'googleai/gemini-1.5-flash-latest';
    
    const result = await ai.generate({
      model,
      prompt: prompt, // On passe directement la question au modèle
      // Pas d'historique pour l'instant pour assurer la stabilité
    });
    
    return { content: result.text() };
  }
);
