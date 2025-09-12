
'use server';
/**
 * @fileOverview Flux Genkit pour l'assistant conversationnel.
 * - chatbotFlow: Gère la conversation avec l'historique et les outils.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';
import { searchMenuTool } from '../tools/menu-tools';
import { Message, partSchema } from 'genkit';

const ChatbotInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(partSchema),
  })).describe("L'historique des messages de la conversation."),
  prompt: z.string().describe("La dernière question ou instruction de l'utilisateur."),
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
  async ({ history, prompt }) => {
    console.log("------- Chatbot Flow Server -------");
    console.log("Received History:", JSON.stringify(history, null, 2));
    console.log("Received Prompt:", prompt);

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      history: history as Message[],
      tools: [searchMenuTool, getAvailablePreparationsTool],
      system: `Vous êtes "Le Singulier AI", un assistant expert pour le restaurant "Le Singulier". Votre rôle est d'aider le personnel (chefs, managers) à gérer le menu, les recettes, et à répondre à leurs questions de manière précise et professionnelle.
  Utilisez les outils à votre disposition pour trouver des informations sur le menu et les préparations disponibles.
  Si une question sort du contexte du restaurant, déclinez poliment.`,
    });

    const responseText = llmResponse.text;
    console.log("LLM Response:", responseText);
    
    return { response: responseText };
  }
);
