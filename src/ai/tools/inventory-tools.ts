'use server';
/**
 * @fileOverview Outil Genkit pour interroger l'inventaire des ingrédients.
 * - searchInventoryTool: Permet de rechercher des ingrédients et de vérifier leur stock.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ingredient } from '@/lib/types';

// Schéma de la sortie pour un ingrédient
const IngredientStockSchema = z.object({
  name: z.string().describe("Le nom de l'ingrédient."),
  stockQuantity: z.number().describe("La quantité actuelle en stock."),
  unit: z.string().describe("L'unité d'achat de l'ingrédient (ex: kg, l, pièce)."),
  lowStockThreshold: z.number().describe("Le seuil de stock bas."),
});

export const searchInventoryTool = ai.defineTool(
  {
    name: 'searchInventory',
    description: "Recherche des ingrédients dans l'inventaire pour vérifier leur niveau de stock. Peut être utilisé pour trouver des ingrédients par nom ou pour lister tous les ingrédients et leur stock.",
    inputSchema: z.object({
      query: z.string().optional().describe('Le terme de recherche. Peut être un nom d\'ingrédient.'),
    }),
    outputSchema: z.array(IngredientStockSchema).describe('Une liste d\'ingrédients correspondants avec leur niveau de stock.'),
  },
  async ({ query: searchTerm }) => {
    try {
      const ingredientsRef = collection(db, 'ingredients');
      const q = query(ingredientsRef);
      const querySnapshot = await getDocs(q);

      const allIngredients = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));

      let filteredIngredients = allIngredients;

      if (searchTerm) {
        const lowercasedQuery = searchTerm.toLowerCase();
        filteredIngredients = allIngredients.filter(ingredient =>
          ingredient.name.toLowerCase().includes(lowercasedQuery)
        );
      }
      
      // On ne retourne que les champs définis dans le schéma de sortie
      return filteredIngredients.map(ing => ({
        name: ing.name,
        stockQuantity: ing.stockQuantity,
        unit: ing.purchaseUnit,
        lowStockThreshold: ing.lowStockThreshold,
      }));

    } catch (error) {
      console.error("Error searching inventory from tool:", error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }
);
