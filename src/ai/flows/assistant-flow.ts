
'use server';
/**
 * @fileOverview Flow pour l'assistant de chat.
 * - chat: Gère une conversation avec l'IA en utilisant le contexte de l'application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getIngredientsTool, getPreparationsTool, getRecipesTool } from '../tools/assistant-tools';


const ChatInputSchema = z.object({
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })),
});
type ChatInput = z.infer<typeof ChatInputSchema>;


const ChatOutputSchema = z.object({
    content: z.string(),
});
type ChatOutput = z.infer<typeof ChatOutputSchema>;


const assistantPrompt = `
Tu es "Le Singulier AI", un assistant expert en gestion de restaurant et en analyse culinaire, créé pour aider le gérant du restaurant "Le Singulier". Ton ton est professionnel et collaboratif.
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
  async (input) => {
    console.log('======== [ASSISTANT FLOW START] ========');
    console.log('Received input:', JSON.stringify(input, null, 2));
    
    try {
        if (!input.history || input.history.length === 0) {
            console.error('Flow Error: History is empty or undefined.');
            return { content: "Désolé, je n'ai pas reçu de message. L'historique est vide." };
        }

        const lastUserMessage = input.history[input.history.length - 1];
        if (!lastUserMessage || lastUserMessage.role !== 'user') {
            console.error('Flow Error: No valid last user message found.');
            return { content: "Désolé, je n'ai pas reçu de question valide de votre part." };
        }
        
        const currentPrompt = lastUserMessage.content;
        console.log('Current user prompt:', currentPrompt);

        const historyForModel = input.history.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
          content: [{ text: msg.content }],
        }));
        console.log('History being sent to model:', JSON.stringify(historyForModel, null, 2));

        const result = await ai.generate({
          model: 'googleai/gemini-pro',
          prompt: currentPrompt,
          system: assistantPrompt,
          tools: [getRecipesTool, getPreparationsTool, getIngredientsTool],
          history: historyForModel,
        });
        
        console.log('\n======== [RAW MODEL OUTPUT] ========');
        console.log(JSON.stringify(result.output, null, 2));
        console.log('====================================\n');
        
        const textResponse = result.text;
        
        if (!textResponse) {
          console.warn('Text response is empty. This might be due to a tool call. The flow will not crash.');
          return { content: "J'ai utilisé mes outils pour traiter votre demande. Comment puis-je vous aider davantage ?" };
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
        return { content: `Désolé, une erreur critique est survenue sur le serveur : ${e.message}` };
    }
  }
);
