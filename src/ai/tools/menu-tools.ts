
'use server';
/**
 * @fileOverview Outil Genkit pour interroger le menu.
 * - searchMenuTool: Permet de rechercher des plats dans la base de données Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe } from '@/lib/types';

// Schéma de la sortie pour un plat individuel
const DishSchema = z.object({
  name: z.string().describe('Le nom du plat.'),
  category: z.string().describe('La catégorie du plat (ex: Entrées, Plats principaux).'),
  price: z.number().describe('Le prix de vente du plat.'),
  description: z.string().describe('La description du plat.'),
  ingredients: z.array(z.string()).describe('La liste des ingrédients principaux du plat.'),
});

export const searchMenuTool = ai.defineTool(
  {
    name: 'searchMenu',
    description: 'Recherche des plats dans le menu du restaurant. Peut être utilisé pour trouver des plats par nom, catégorie, ou pour lister tous les plats.',
    inputSchema: z.object({
      query: z.string().optional().describe('Le terme de recherche. Peut être un nom de plat, une catégorie, ou un ingrédient.'),
    }),
    outputSchema: z.array(DishSchema).describe('Une liste de plats correspondant à la recherche.'),
  },
  async ({ query: searchTerm }) => {
    try {
      const recipesRef = collection(db, 'recipes');
      const q = query(recipesRef);
      const querySnapshot = await getDocs(q);

      const allDishes = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Recipe))
        .filter(d => d.type === 'Plat');

      let filteredDishes = allDishes;

      if (searchTerm) {
        const lowercasedQuery = searchTerm.toLowerCase();
        filteredDishes = allDishes.filter(dish =>
          dish.name.toLowerCase().includes(lowercasedQuery) ||
          dish.category.toLowerCase().includes(lowercasedQuery) ||
          dish.description.toLowerCase().includes(lowercasedQuery)
          // Note: La recherche par ingrédient nécessiterait de récupérer les ingrédients liés.
          // Pour garder l'outil simple, on se concentre sur les champs directs du plat.
        );
      }
      
      // On ne retourne pas tous les champs, seulement ceux définis dans le schéma de sortie.
      // La recherche d'ingrédients est une approximation basée sur la description.
      return filteredDishes.map(dish => ({
        name: dish.name,
        category: dish.category,
        price: dish.price,
        description: dish.description,
        ingredients: dish.description.split(/, | et /) // Approximation simple
      }));

    } catch (error) {
      console.error("Error searching menu from tool:", error);
      // En cas d'erreur, retourner un tableau vide pour ne pas bloquer le flow.
      return [];
    }
  }
);
