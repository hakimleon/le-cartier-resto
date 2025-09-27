'use server';
/**
 * @fileOverview Outil Genkit pour interroger la collection de garnitures.
 * - searchGarnishesTool: Permet de rechercher des fiches techniques de garnitures.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';

// Schéma de la sortie pour une garniture individuelle
const GarnishSchema = z.object({
  name: z.string().describe('Le nom de la garniture.'),
  category: z.string().describe('La catégorie de la garniture (ex: Purées, Gratins).'),
  description: z.string().describe('La description de la garniture.'),
  productionUnit: z.string().optional().describe("Unité de production (ex: 'kg', 'pièce')."),
});

export const searchGarnishesTool = ai.defineTool(
  {
    name: 'searchGarnishes',
    description: 'Recherche des fiches techniques de garnitures. Peut être utilisé pour trouver des garnitures par nom, catégorie, ou pour lister toutes les garnitures disponibles.',
    inputSchema: z.object({
      query: z.string().optional().describe('Le terme de recherche. Peut être un nom de garniture, une catégorie, ou un ingrédient clé.'),
    }),
    outputSchema: z.array(GarnishSchema).describe('Une liste de garnitures correspondant à la recherche.'),
  },
  async ({ query: searchTerm }) => {
    try {
      const garnishesRef = collection(db, 'garnishes');
      const q = query(garnishesRef);
      const querySnapshot = await getDocs(q);

      const allGarnishes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Preparation));

      let filteredGarnishes = allGarnishes;

      if (searchTerm) {
        const lowercasedQuery = searchTerm.toLowerCase();
        filteredGarnishes = allGarnishes.filter(garnish =>
          garnish.name.toLowerCase().includes(lowercasedQuery) ||
          (garnish.category && garnish.category.toLowerCase().includes(lowercasedQuery)) ||
          (garnish.description && garnish.description.toLowerCase().includes(lowercasedQuery))
        );
      }
      
      return filteredGarnishes.map(garnish => ({
        name: garnish.name,
        category: garnish.category || 'Non classée',
        description: garnish.description || 'Pas de description.',
        productionUnit: garnish.productionUnit,
      }));

    } catch (error) {
      console.error("Error searching garnishes from tool:", error);
      return [];
    }
  }
);
