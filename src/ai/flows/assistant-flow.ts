
'use server';
/**
 * @fileOverview Flow pour l'assistant de chat.
 * - chat: Gère une conversation avec l'IA en utilisant le contexte de l'application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getIngredientsTool, getPreparationsTool, getRecipesTool } from '../tools/assistant-tools';

// Le schéma d'entrée attend maintenant directement un tableau de messages.
const ChatInputSchema = z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
}));
type ChatInput = z.infer<typeof ChatInputSchema>;


const ChatOutputSchema = z.object({
    content: z.string(),
});
type ChatOutput = z.infer<typeof ChatOutputSchema>;


const assistantSystemPrompt = `Tu es "Le Singulier AI", un assistant expert en gestion de restaurant et en analyse culinaire, créé pour aider le gérant du restaurant "Le Singulier". Ton ton est professionnel et collaboratif.
Ta mission est de répondre aux questions de manière précise en te basant sur les données du restaurant.
Pour toute question concernant les plats, les ingrédients, les coûts, les stocks, les préparations, tu dois IMPÉRATIVEMENT utiliser les outils à ta disposition (\`getRecipesTool\`, \`getIngredientsTool\`, \`getPreparationsTool\`).
Si on te demande la quantité produite d'une préparation, utilise getPreparationsTool qui contient cette information.
Si une donnée semble anormale (ex: coût à 0), signale-le poliment.
Formate tes réponses en Markdown pour une meilleure lisibilité.
`;

export const chatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (history) => {
    console.log('======== [ASSISTANT FLOW START] ========');
    console.log('Received history:', JSON.stringify(history, null, 2));

    try {
        if (!history || history.length === 0) {
            throw new Error("L'historique des messages est vide.");
        }

        // Le dernier message est la question actuelle de l'utilisateur
        const lastUserMessage = history[history.length - 1];
        if (!lastUserMessage || lastUserMessage.role !== 'user') {
            throw new Error("Le dernier message n'est pas une question de l'utilisateur.");
        }
        
        const currentPrompt = lastUserMessage.content;
        console.log('Current user prompt:', currentPrompt);

        // L'historique pour le modèle est tout sauf le dernier message.
        const historyForModel = history.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
          content: [{ text: msg.content }],
        }));
        
        console.log('History being sent to model:', JSON.stringify(historyForModel, null, 2));

        const result = await ai.generate({
          model: 'googleai/gemini-pro',
          system: assistantSystemPrompt,
          prompt: currentPrompt,
          tools: [getRecipesTool, getPreparationsTool, getIngredientsTool],
          history: historyForModel.length > 0 ? historyForModel : undefined,
        });
        
        console.log('======== [RAW MODEL OUTPUT] ========');
        console.log(JSON.stringify(result, null, 2));
        
        const textResponse = result.text();
        
        if (!textResponse) {
             // Si le texte est vide, c'est probablement un appel d'outil. 
             // On retourne un message générique en attendant la prochaine interaction.
             const toolCalls = result.toolCalls();
             if (toolCalls && toolCalls.length > 0) {
                 console.log(`Tool call detected, returning a placeholder message.`);
                 return { content: "J'utilise mes outils pour analyser votre demande. Comment puis-je vous aider ensuite ?" };
             }
             console.warn('Text response and tool calls are both empty. Returning a fallback message.');
             return { content: "Je ne suis pas sûr de savoir comment répondre à cela. Pouvez-vous reformuler ?" };
        }

        console.log('Final textResponse to be returned:', textResponse);
        console.log('======== [ASSISTANT FLOW END] ========');
        return { content: textResponse };

    } catch(e: any) {
        console.error('!!!!!!!!! CRITICAL ERROR IN FLOW !!!!!!!!!');
        console.error('Error name:', e.name);
        console.error('Error message:', e.message);
        console.error('Error stack:', e.stack);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        // Renvoyer l'erreur pour que le client puisse l'afficher
        throw new Error(`Erreur interne du serveur: ${e.message}`);
    }
  }
);

    