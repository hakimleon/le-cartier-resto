'use server';
/**
 * @fileOverview Server Action pour interagir directement avec l'API Gemini.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Message } from 'genkit';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("La variable d'environnement GEMINI_API_KEY est manquante.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

// Convertir notre type Message Genkit en type attendu par le SDK @google/genai
const convertToGoogleAIMessages = (history: Message[]) => {
    return history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.content.map(part => ({ text: part.text || '' }))
    }));
}


export async function sendMessageToChat(history: Message[], prompt: string): Promise<string> {
    try {
        const chat = model.startChat({
            // L'historique ne doit contenir que les messages PRÉCÉDENTS.
            history: convertToGoogleAIMessages(history),
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        
        return response.text();

    } catch (error) {
        console.error("Error in sendMessageToChat:", error);
        if (error instanceof Error) {
            return `Erreur lors de la communication avec l'IA: ${error.message}`;
        }
        return "Erreur inconnue lors de la communication avec l'IA.";
    }
}
