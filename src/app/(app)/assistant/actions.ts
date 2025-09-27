
'use server';
/**
 * @fileOverview Server Action pour interagir avec le chatbotFlow.
 */

import { chatbotFlow } from '@/ai/flows/assistant-flow';
import type { Message } from 'genkit';

export async function sendMessageToChat(history: Message[], prompt: string): Promise<string> {
    try {
        // Envoie l'historique précédent et le nouveau prompt au flow.
        const response = await chatbotFlow({ history, prompt });
        return response;
    } catch (error) {
        console.error("Error in sendMessageToChat calling chatbotFlow:", error);
        if (error instanceof Error) {
            return `Erreur lors de la communication avec l'IA: ${error.message}`;
        }
        return "Erreur inconnue lors de la communication avec l'IA.";
    }
}
