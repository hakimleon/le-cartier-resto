'use server';
/**
 * @fileOverview Outils Genkit pour interagir avec les données de recettes.
 *
 * - searchForMatchingPreparations: Un outil qui recherche des préparations correspondants à un terme de recherche.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';


export const searchForMatchingPreparationsTool = ai.defineTool(
    {
        name: 'searchForMatchingPreparations',
        description: 'Recherche des fiches de préparation (sous-recettes) existantes par mot-clé pour voir si un composant de recette peut être remplacé par une préparation standardisée. Doit être appelé pour chaque composant majeur (fond, sauce, purée, etc.).',
        inputSchema: z.object({
            query: z.string().describe("Terme de recherche pour la préparation (ex: 'fond de veau', 'béchamel')."),
        }),
        outputSchema: z.array(z.string()).describe("Liste des noms de préparations existantes qui correspondent."),
    },
    async ({ query }) => {
        try {
            const preparationsSnapshot = await getDocs(collection(db, 'preparations'));
            const preparations = preparationsSnapshot.docs.map(doc => (doc.data() as Preparation).name);
            
            if (!query) {
                return preparations; // Retourne tout si aucune query
            }

            const lowercasedQuery = query.toLowerCase();
            const filtered = preparations.filter(name => name.toLowerCase().includes(lowercasedQuery));
            
            return filtered;
        } catch (error) {
            console.error("Error searching for preparations:", error);
            return [];
        }
    }
);

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
