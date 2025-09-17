
'use server';
/**
 * @fileOverview Outils pour interagir avec les données de recettes.
 *
 * - getAllPreparationNames: Récupère les noms de toutes les préparations.
 * - searchForMatchingPreparationsTool: Outil Genkit pour rechercher des préparations correspondantes.
 */

import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';
import { ai } from '@/ai/genkit';
import { z } from 'zod';


/**
 * Récupère les noms de toutes les préparations disponibles.
 * @returns Une promesse qui se résout en un tableau de noms de préparations.
 */
export async function getAllPreparationNames(): Promise<string[]> {
    try {
        const preparationsSnapshot = await getDocs(collection(db, 'preparations'));
        const preparationNames = preparationsSnapshot.docs.map(doc => (doc.data() as Preparation).name);
        return preparationNames;
    } catch (error) {
        console.error("Error fetching all preparation names:", error);
        return [];
    }
}


export const searchForMatchingPreparationsTool = ai.defineTool(
  {
    name: 'searchForMatchingPreparations',
    description: 'Recherche dans la base de données une ou plusieurs préparations existantes qui correspondent à un terme de recherche.',
    inputSchema: z.object({
      query: z.string().describe('Le terme à rechercher (ex: "fond de veau", "sauce tomate").'),
    }),
    outputSchema: z.array(z.string()).describe('Une liste de noms de préparations correspondantes trouvées.'),
  },
  async ({ query: searchTerm }) => {
    if (!searchTerm) {
        return [];
    }
    const allPreparationNames = await getAllPreparationNames();
    const lowercasedQuery = searchTerm.toLowerCase();

    // Logique de recherche simple, peut être améliorée
    const matches = allPreparationNames.filter(name =>
      name.toLowerCase().includes(lowercasedQuery)
    );
    
    return matches;
  }
);
