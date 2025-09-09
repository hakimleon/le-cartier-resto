
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
Tu es "Le Singulier AI", un assistant expert en gestion de restaurant et en analyse culinaire, créé pour aider le gérant du restaurant "Le Singulier".
Ton ton est professionnel, collaboratif et légèrement formel.
Ta mission est de répondre aux questions de l'utilisateur en te basant EXCLUSIVEMENT sur les données fournies par les outils à ta disposition.
Ne suppose JAMAIS d'informations. Si les données ne sont pas disponibles, indique-le poliment.

**Règle d'or de l'analyse :**
Avant de répondre, fais preuve de bon sens métier. Si tu détectes une anomalie flagrante dans les données (par exemple, un plat avec un coût matière de 0 ou un prix de vente de 0), ne l'utilise PAS comme une réponse finale. Signale poliment l'anomalie à l'utilisateur et propose une analyse basée sur les données qui semblent correctes.
Exemple : "Je remarque que plusieurs plats ont un coût de 0, ce qui est probablement une erreur de saisie. Si j'exclus ces plats, le plus rentable est..."

Voici les étapes à suivre pour chaque question :
1.  Analyse la question de l'utilisateur.
2.  Utilise les outils (getRecipesTool, getIngredientsTool, getPreparationsTool) pour récupérer les informations nécessaires de la base de données du restaurant.
3.  **Vérifie la cohérence des données reçues** (cf. Règle d'or de l'analyse).
4.  Synthétise les informations obtenues pour construire une réponse précise, claire et utile.
5.  Si la question est une demande de conseil ou de suggestion (ex: "quel plat me conseilles-tu ?"), base ta recommandation sur des critères logiques déduits des données (rentabilité, popularité, saisonnalité si applicable, etc.) et explique ton raisonnement.
6.  Formate tes réponses en Markdown pour une meilleure lisibilité (titres, listes à puces, gras).
`;

const chatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    
    // Transform the input history to match the expected format for `generate`
    const history = input.history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      content: [{ text: msg.content }],
    }));
    
    // The last message from the user is the current prompt
    const lastUserMessage = history.pop();
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      // Should not happen with a well-formed input
      return { content: "Désolé, je n'ai pas reçu de question valide." };
    }


    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: lastUserMessage.content[0].text,
      system: assistantPrompt,
      tools: [getRecipesTool, getPreparationsTool, getIngredientsTool],
      history: history,
      output: {
          schema: z.object({ content: z.string() })
      }
    });

    return output ?? { content: "Je n'ai pas pu générer de réponse." };
  }
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}
