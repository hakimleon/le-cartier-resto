
'use server';
/**
 * @fileOverview Server Action pour interagir avec le chatbotFlow.
 */

import { chatbotFlow } from '@/ai/flows/assistant-flow';
import type { Message } from 'genkit';

export async function sendMessageToChat(history: Message[], prompt: string): Promise<string> {
    try {
        // L'historique complet est maintenant reçu, on peut l'envoyer au flow.
        // Le prompt actuel est le dernier message de l'historique.
        const response = await chatbotFlow({ history, prompt, cacheBuster: Math.random() });
        return response;
    } catch (error) {
        console.error("Error in sendMessageToChat calling chatbotFlow:", error);
        if (error instanceof Error) {
            return `Erreur lors de la communication avec l'IA: ${error.message}`;
        }
        return "Erreur inconnue lors de la communication avec l'IA.";
    }
}
