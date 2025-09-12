'use server';
/**
 * @fileOverview Server Action pour interagir directement avec l'API Gemini pour le chat.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Message } from "genkit";

// Note: This should be secured in a real-world application
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});


// Transformer le format de message Genkit/UI vers le format de l'API Gemini
function transformHistoryToGemini(history: Message[]) {
    return history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.content.map(c => ({ text: c.text || '' }))
    }));
}


export async function sendMessageToChat(history: Message[], newMessage: string): Promise<string> {
    try {
        const geminiHistory = transformHistoryToGemini(history);

        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(newMessage);
        const response = await result.response;
        const text = response.text();
        
        return text;

    } catch (error) {
        console.error("Error in sendMessageToChat:", error);
        if (error instanceof Error) {
            return `Désolé, une erreur est survenue lors de la communication avec l'IA: ${error.message}`;
        }
        return "Désolé, une erreur inconnue est survenue.";
    }
}
