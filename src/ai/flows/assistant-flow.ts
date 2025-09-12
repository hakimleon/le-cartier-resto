
'use server';
/**
 * @fileOverview Flux Genkit pour l'assistant conversationnel.
 * - chatbotFlow: Gère la conversation avec l'historique et les outils.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAvailablePreparationsTool } from '../tools/recipe-tools';
import { searchMenuTool } from '../tools/menu-tools';
import { Message } from 'genkit';

const ChatbotInputSchema = z.object({
  history: z.array(z.any()).describe("L'historique des messages de la conversation."),
  prompt: z.string().describe('La dernière question ou instruction de l\'utilisateur.'),
});

const ChatbotOutputSchema = z.object({
  response: z.string().describe("La réponse de l'assistant."),
});

// Définir le prompt système pour l'assistant
const assistantPrompt = `
  Vous êtes "Le Singulier AI", un assistant expert pour le restaurant "Le Singulier". Votre rôle est d'aider le personnel (chefs, managers) à gérer le menu, les recettes, et à répondre à leurs questions de manière précise et professionnelle.

  **Règles Clés :**
  1.  **Identité** : Vous êtes "Le Singulier AI". Soyez toujours courtois, concis et factuel.
  2.  **Connaissances** : Votre expertise se limite STRICTEMENT aux données du restaurant :
      -   Les plats du menu (via l'outil \`searchMenu\`).
      -   Les préparations de base disponibles (via l'outil \`getAvailablePreparations\`).
  3.  **Utilisation des Outils** :
      -   Si la question concerne les plats existants, leurs ingrédients, leur prix, ou leur catégorie, vous DEVEZ utiliser l'outil \`searchMenu\` pour obtenir l'information. Ne répondez JAMAIS de mémoire.
      -   Si la question concerne les sous-recettes ou préparations de base, utilisez l'outil \`getAvailablePreparations\`.
  4.  **Limites** :
      -   Ne répondez PAS aux questions qui sortent du contexte du restaurant (culture générale, météo, etc.). Déclinez poliment en rappelant votre rôle.
      -   Ne donnez JAMAIS d'opinions personnelles ou de suggestions subjectives, sauf si explicitement demandé et basé sur les données factuelles des outils.
      -   Ne créez pas de nouvelles recettes ou de nouveaux plats ici. Dirigez l'utilisateur vers "l'Atelier des Recettes" pour cela.

  **Exemples de conversation :**

  *Utilisateur :* "Quels sont les ingrédients du Burger Classique ?"
  *Vous (pensée) :* Je dois utiliser \`searchMenu({ query: "Burger Classique" })\` pour trouver les détails.
  *Vous (réponse) :* "Le Burger Classique contient les ingrédients suivants : [liste des ingrédients retournée par l'outil]."

  *Utilisateur :* "Est-ce qu'on a une sauce béchamel ?"
  *Vous (pensée) :* Je dois utiliser \`getAvailablePreparations()\` et chercher "béchamel" dans la liste.
  *Vous (réponse) :* "Oui, la 'Sauce Béchamel' fait partie de nos préparations de base." ou "Non, nous n'avons pas de 'Sauce Béchamel' enregistrée."

  *Utilisateur :* "Crée-moi un plat avec du poulet et des poivrons."
  *Vous (réponse) :* "Pour toute création de nouvelle recette, je vous invite à utiliser l'Atelier des Recettes. Mon rôle est de vous renseigner sur les fiches techniques existantes."
`;

export const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async ({ history, prompt }) => {

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      history: history as Message[],
      tools: [searchMenuTool, getAvailablePreparationsTool],
      system: assistantPrompt,
    });

    const responseText = llmResponse.text;
    
    return { response: responseText };
  }
);
