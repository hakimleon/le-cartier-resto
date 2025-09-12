

'use server';
/**
 * @fileOverview Outils Genkit pour l'assistant IA.
 * Fournit à l'IA un accès en lecture aux données de l'application (recettes, ingrédients, etc.).
 * VERSION SIMPLIFIÉE POUR LE DÉBOGAGE.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
            },
            {
                id: 'recipe-2',
                name: 'Salade César',
                category: 'Entrées froides et chaudes',
                price: 1200,
                costPerPortion: 300,
                portions: 1,
                status: 'Actif',
                ingredients: ['Laitue romaine', 'Poulet grillé', 'Croûtons', 'Parmesan'],
                preparations: ['Sauce César']
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
            },
            {
                id: 'prep-2',
                name: 'Sauce César',
                description: 'Sauce onctueuse pour la salade César.',
                productionQuantity: 0.5,
                productionUnit: 'L',
                ingredients: ['Jaune d\'oeuf', 'Huile', 'Anchois', 'Ail', 'Parmesan'],
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
            { id: 'ing-4', name: 'Mayonnaise', category: 'Condiments', stockQuantity: 2, lowStockThreshold: 1, purchaseUnit: 'kg' },
            { id: 'ing-5', name: 'Laitue romaine', category: 'Légumes frais', stockQuantity: 3, lowStockThreshold: 5, purchaseUnit: 'pièce' },
        ];
    }
);
