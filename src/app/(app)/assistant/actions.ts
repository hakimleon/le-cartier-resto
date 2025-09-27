'use server';
/**
 * @fileOverview Server Action pour interagir avec le chatbotFlow.
 */

import { chatbotFlow } from '@/ai/flows/assistant-flow';
import type { Message } from 'genkit';

export async function sendMessageToChat(history: Message[], prompt: string): Promise<{responseText: string, logs: any}> {
    const logData = {
        receivedHistory: history,
        receivedPrompt: prompt,
    };
    
    console.log("Données reçues par l'action serveur sendMessageToChat:", JSON.stringify(logData, null, 2));

    try {
        // Envoie l'historique précédent et le nouveau prompt au flow.
        const response = await chatbotFlow({ history, prompt });
        return { responseText: response, logs: logData };
    } catch (error) {
        console.error("Error in sendMessageToChat calling chatbotFlow:", error);
        if (error instanceof Error) {
            const errorMessage = `Erreur lors de la communication avec l'IA: ${error.message}`;
            return { responseText: errorMessage, logs: logData };
        }
        const unknownError = "Erreur inconnue lors de la communication avec l'IA.";
        return { responseText: unknownError, logs: logData };
    }
}
