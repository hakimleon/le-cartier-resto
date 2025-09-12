
'use server';
/**
 * @fileOverview Tools for the AI assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe } from '@/lib/types';

export const getRecipesTool = ai.defineTool(
    {
        name: 'getRecipes',
        description: 'Récupère la liste des plats disponibles dans le menu du restaurant.',
        outputSchema: z.array(z.string()),
    },
    async () => {
        try {
            const recipesQuery = query(collection(db, "recipes"), where("type", "==", "Plat"));
            const snapshot = await getDocs(recipesQuery);
            const recipes = snapshot.docs.map(doc => (doc.data() as Recipe).name);
            return recipes;
        } catch (error) {
            console.error("Error fetching recipes from Firestore:", error);
            return ["Erreur: Impossible de récupérer les plats."];
        }
    }
);
