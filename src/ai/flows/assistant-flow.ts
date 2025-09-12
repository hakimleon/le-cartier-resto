
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

const chatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    
    // Transforme l'historique pour l'API Genkit
    const history = input.history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      content: [{ text: msg.content }],
    }));
    
    // Le dernier message de l'utilisateur est le prompt actuel
    const lastUserMessage = history.pop();
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return { content: "Désolé, je n'ai pas reçu de question valide." };
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: lastUserMessage.content[0].text,
      system: assistantPrompt,
      tools: [getRecipesTool, getPreparationsTool, getIngredientsTool],
      history: history,
    });
    
    let textResponse = '';
    if (output?.content?.parts) {
        for (const part of output.content.parts) {
            if (part.text) {
                textResponse += part.text;
            } else if (part.toolResponse) {
                // Should be handled automatically by Genkit, but as a fallback:
                textResponse += `(Résultat d'outil: ${part.toolResponse.name})`;
            }
        }
    }

    if (!textResponse) {
      // Check if there was a tool call that should have been handled
      const toolCall = output?.content?.parts.find(part => part.toolRequest);
      if (toolCall) {
        // This case indicates Genkit should have handled the tool call but didn't return text.
        // It's a state that shouldn't happen in normal operation if tools are set up correctly.
        // We can ask the model to summarize what it just did.
        const followup = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: "Summarize the result of the tool call you just made in a user-friendly way.",
            history: [...history, lastUserMessage, {role: 'model', content: output.content.parts}]
        });
        textResponse = followup.output?.content?.parts.map(p => p.text).join('') || "J'ai utilisé un outil, mais je n'ai pas pu formuler de réponse. Veuillez reformuler.";
      } else {
        return { content: "Je suis désolé, je n'ai pas pu générer de réponse pour le moment. Veuillez réessayer." };
      }
    }

    return { content: textResponse };
  }
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}
