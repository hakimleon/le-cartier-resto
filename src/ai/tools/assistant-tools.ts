

'use server';
/**
 * @fileOverview Outils Genkit pour l'assistant IA.
 * Fournit à l'IA un accès en lecture aux données de l'application (recettes, ingrédients, etc.).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// Firestore imports are kept for future re-activation, but are not used in this simplified version.
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ingredient, Preparation, Recipe, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';


// Schema for the output of the getRecipes tool
const RecipeToolOutputSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number().optional(),
    costPerPortion: z.number().optional(),
    portions: z.number().optional(),
    status: z.string().optional(),
    ingredients: z.array(z.string()).describe("La liste des noms des ingrédients bruts utilisés dans ce plat."),
    preparations: z.array(z.string()).describe("La liste des noms des sous-recettes (préparations) utilisées dans ce plat."),
}));

export const getRecipesTool = ai.defineTool(
    {
        name: 'getRecipesTool',
        description: 'Récupère la liste de tous les plats (recettes de type "Plat") disponibles, avec leur catégorie, prix, coût par portion, et la liste de leurs ingrédients et préparations.',
        outputSchema: RecipeToolOutputSchema,
    },
    async () => {
        console.log('[TOOL CALL] getRecipesTool triggered (simplified).');
        // Returning static data to avoid complex DB calls during debugging.
        return [
            {
                id: 'recipe-1',
                name: 'Burger Classique',
                category: 'Nos Burgers Bistronomiques',
                price: 1500,
                costPerPortion: 450,
                portions: 1,
                status: 'Actif',
                ingredients: ['Pain Burger', 'Steak haché', 'Cheddar', 'Salade', 'Tomate', 'Oignon'],
                preparations: ['Sauce Burger Maison']
            }
        ];
    }
);


export const getPreparationsTool = ai.defineTool(
    {
        name: 'getPreparationsTool',
        description: 'Récupère la liste de toutes les préparations (sous-recettes) disponibles, y compris la quantité produite, son unité, et les ingrédients et sous-préparations qui la composent.',
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional(),
            productionQuantity: z.number().optional().describe("La quantité totale produite par cette fiche technique."),
            productionUnit: z.string().optional().describe("L'unité de la quantité produite (ex: kg, L, pièce)."),
            ingredients: z.array(z.string()).describe("La liste des noms des ingrédients bruts utilisés dans cette préparation."),
            preparations: z.array(z.string()).describe("La liste des noms des autres préparations (sous-recettes) utilisées dans celle-ci."),
        })),
    },
    async () => {
        console.log('[TOOL CALL] getPreparationsTool triggered (simplified).');
        return [
            {
                id: 'prep-1',
                name: 'Sauce Burger Maison',
                description: 'Sauce secrète pour nos burgers.',
                productionQuantity: 1,
                productionUnit: 'kg',
                ingredients: ['Mayonnaise', 'Ketchup', 'Cornichons'],
                preparations: []
            }
        ];
    }
);

export const getIngredientsTool = ai.defineTool(
    {
        name: 'getIngredientsTool',
        description: "Récupère la liste de tous les ingrédients, y compris leur niveau de stock et le seuil de stock bas.",
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            category: z.string(),
            stockQuantity: z.number(),
            lowStockThreshold: z.number(),
            purchaseUnit: z.string(),
        })),
    },
    async () => {
        console.log('[TOOL CALL] getIngredientsTool triggered (simplified).');
        return [
            { id: 'ing-1', name: 'Tomate', category: 'Légumes frais', stockQuantity: 5, lowStockThreshold: 2, purchaseUnit: 'kg' },
            { id: 'ing-2', name: 'Steak haché', category: 'Viandes', stockQuantity: 10, lowStockThreshold: 5, purchaseUnit: 'kg' },
            { id: 'ing-3', name: 'Pain Burger', category: 'Boulangerie', stockQuantity: 20, lowStockThreshold: 10, purchaseUnit: 'pièce' },
        ];
    }
);
