
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

    if (!input.history || input.history.length === 0) {
        console.error('Flow Error: History is empty or undefined.');
        return { content: "Désolé, je n'ai pas reçu de message. L'historique est vide." };
    }

    // Convertir l'historique simple en format Genkit pour le modèle
    const history = input.history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      content: [{ text: msg.content }],
    }));

    // Isoler le dernier message de l'utilisateur qui est le prompt actuel
    const lastUserMessage = history.pop();
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
        console.error('Flow Error: No valid last user message found.');
        return { content: "Désolé, je n'ai pas reçu de question valide de votre part." };
    }
    
    const currentPrompt = lastUserMessage.content[0].text;
    console.log('Current user prompt:', currentPrompt);
    console.log('History being sent to model:', JSON.stringify(history, null, 2));

    try {
        const result = await ai.generate({
          model: 'googleai/gemini-pro',
          prompt: currentPrompt,
          system: assistantPrompt,
          tools: [getRecipesTool, getPreparationsTool, getIngredientsTool],
          history: history,
        });
        
        console.log('\n======== [RAW MODEL OUTPUT] ========');
        const output = result.output;
        console.log(JSON.stringify(output, null, 2));
        console.log('====================================\n');
        
        let textResponse = result.text;
        
        // Gérer le cas où l'IA appelle un outil mais ne renvoie pas de texte
        if (!textResponse && output?.content) {
          console.warn('Text response is empty. Checking for tool calls...');
          const toolCalls = output.content.parts.filter(part => part.toolRequest);
          const toolResponses = output.content.parts.filter(part => part.toolResponse);

          if (toolCalls.length > 0) {
            textResponse = "J'ai utilisé mes outils pour chercher l'information, mais je n'ai pas encore formulé de réponse. Pouvez-vous préciser votre question pour que je puisse vous aider ?.";
          } else if (toolResponses.length > 0) {
             textResponse = "J'ai consulté mes données. Que souhaitez-vous savoir de plus ?";
          } else {
             textResponse = "Je suis désolé, une erreur inattendue est survenue et je n'ai pas pu formuler de réponse. Veuillez réessayer.";
          }
        } else if (!textResponse) {
             textResponse = "Je n'ai pas de réponse pour le moment. Veuillez reformuler votre question.";
        }

        console.log('Final textResponse to be returned:', textResponse);
        console.log('======== [ASSISTANT FLOW END] ========');
        return { content: textResponse };
    } catch(e: any) {
        console.error('!!!!!!!!! CRITICAL ERROR IN FLOW !!!!!!!!!');
        console.error(e);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        // Renvoyer une erreur plus explicite au client serait idéal, mais pour l'instant, on assure que ça ne crashe pas.
        return { content: `Désolé, une erreur critique est survenue sur le serveur : ${e.message}` };
    }
  }
);
