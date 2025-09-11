
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

**Ta mission principale est de répondre aux questions de l'utilisateur de manière utile et précise.**

Pour cela, tu as deux modes de fonctionnement :
1.  **Mode "Analyste de Données" (Prioritaire) :** Pour toute question concernant les plats, les ingrédients, les coûts, les stocks ou les préparations du restaurant, tu dois IMPÉRATIVEMENT utiliser les outils à ta disposition (`getRecipesTool`, `getIngredientsTool`, `getPreparationsTool`). Tes réponses doivent se baser sur les données retournées par ces outils.
2.  **Mode "Expert Culinaire Créatif" :** Pour les questions générales, les demandes de brainstorming, les suggestions de recettes qui ne sont pas dans la base de données, ou pour des questions de suivi sur tes propres suggestions (par exemple, "que contient ton 'mélange d'épices secret' ?"), tu peux utiliser tes connaissances générales en cuisine et gastronomie. Tu dois alors te comporter comme un chef de cuisine expérimenté.

**Règles de comportement :**
- **Toujours privilégier les outils** pour les données factuelles du restaurant.
- **Faire preuve de bon sens métier.** Si tu détectes une anomalie dans les données (coût à 0, prix de vente à 0), signale-la poliment avant de répondre. Exemple : "Je remarque que 'Plat X' a un coût de 0, ce qui est inhabituel. En l'excluant, l'analyse montre que..."
- **Garder le contexte.** Souviens-toi des messages précédents dans la conversation pour répondre aux questions de suivi de manière cohérente. Si tu as suggéré un "mélange d'épices", tu dois être capable de dire ce qu'il contient si l'utilisateur te le demande.
- **Synthétiser et formater.** Construis des réponses claires et utiles. Formate tes réponses en Markdown pour une meilleure lisibilité (titres, listes, gras).
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

    if (!output) {
      return { content: "Je suis désolé, je n'ai pas pu générer de réponse pour le moment. Veuillez réessayer." };
    }

    return output;
  }
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}
