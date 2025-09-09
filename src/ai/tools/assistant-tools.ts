
'use server';
/**
 * @fileOverview Outils Genkit pour l'assistant IA.
 * Fournit à l'IA un accès en lecture aux données de l'application (recettes, ingrédients, etc.).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ingredient, Preparation, Recipe, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';


// Helper function to calculate cost per portion for a recipe
const calculateRecipeCost = async (recipeId: string, allIngredients: Ingredient[], allPreparations: (Preparation & { cost?: number })[]): Promise<number> => {
    let totalCost = 0;

    // Fetch and calculate cost of direct ingredients
    const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", recipeId));
    const ingredientsSnap = await getDocs(ingredientsQuery);
    for (const ingDoc of ingredientsSnap.docs) {
        const link = ingDoc.data() as RecipeIngredientLink;
        const ingData = allIngredients.find(i => i.id === link.ingredientId);
        if (ingData) {
            const isUnitBased = ['pièce', 'piece'].includes(ingData.purchaseUnit.toLowerCase());
            if (isUnitBased) {
                totalCost += (link.quantity || 0) * (ingData.purchasePrice || 0);
            } else if (ingData.purchasePrice && ingData.purchaseWeightGrams) {
                const costPerGram = ingData.purchasePrice / ingData.purchaseWeightGrams;
                const netCostPerGram = costPerGram / ((ingData.yieldPercentage || 100) / 100);
                
                const u = (unit: string) => unit.toLowerCase().trim();
                const factors: Record<string, number> = { 'kg': 1000, 'g': 1, 'l': 1000, 'ml': 1 };
                const conversionFactor = factors[u(link.unitUse)] || 1;
                
                totalCost += (link.quantity || 0) * conversionFactor * netCostPerGram;
            }
        }
    }

    // Fetch and calculate cost of sub-preparations
    const preparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", recipeId));
    const preparationsSnap = await getDocs(preparationsQuery);
    for (const prepDoc of preparationsSnap.docs) {
        const link = prepDoc.data() as RecipePreparationLink;
        const prepData = allPreparations.find(p => p.id === link.childPreparationId);
        if (prepData?.cost !== undefined) {
             const u = (unit: string) => unit.toLowerCase().trim();
             const factors: Record<string, number> = { 'kg': 1000, 'g': 1, 'l': 1000, 'ml': 1 };
             const toFactor = factors[u(prepData.productionUnit)] || 1;
             const fromFactor = factors[u(link.unitUse)] || 1;
             const conversionFactor = fromFactor / toFactor;
             totalCost += (link.quantity || 0) * prepData.cost * conversionFactor;
        }
    }
    
    return totalCost;
};


// Schema for the output of the getRecipes tool
const RecipeToolOutputSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number().optional(),
    costPerPortion: z.number().optional(),
    portions: z.number().optional(),
    status: z.string().optional(),
}));

export const getRecipesTool = ai.defineTool(
    {
        name: 'getRecipesTool',
        description: 'Récupère la liste de tous les plats (recettes de type "Plat") disponibles, avec leur catégorie, prix, et coût par portion.',
        outputSchema: RecipeToolOutputSchema,
    },
    async () => {
        try {
            // Pre-fetch all ingredients and preparations to calculate costs efficiently
            const ingredientsSnap = await getDocs(collection(db, "ingredients"));
            const allIngredients = ingredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));

            const preparationsSnap = await getDocs(collection(db, "preparations"));
            const allPreparationsData = preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));

            // Calculate cost for each preparation first
            const allPreparations: (Preparation & { cost?: number })[] = [];
            for(const prep of allPreparationsData) {
                const cost = await calculateRecipeCost(prep.id!, allIngredients, []); // Base preps have no sub-preps
                const costPerUnit = prep.productionQuantity > 0 ? cost / prep.productionQuantity : 0;
                allPreparations.push({ ...prep, cost: costPerUnit });
            }

            // Fetch all dishes
            const recipesQuery = query(collection(db, "recipes"), where("type", "==", "Plat"));
            const recipesSnapshot = await getDocs(recipesQuery);
            
            const recipesWithCost = await Promise.all(recipesSnapshot.docs.map(async (doc) => {
                const recipe = doc.data() as Recipe;
                const totalCost = await calculateRecipeCost(doc.id, allIngredients, allPreparations);
                const costPerPortion = recipe.portions > 0 ? totalCost / recipe.portions : 0;

                return {
                    id: doc.id,
                    name: recipe.name,
                    category: recipe.category,
                    price: recipe.price,
                    costPerPortion: costPerPortion,
                    portions: recipe.portions,
                    status: recipe.status
                };
            }));

            return recipesWithCost;
        } catch (error) {
            console.error("Error fetching recipes for tool:", error);
            return [];
        }
    }
);


export const getPreparationsTool = ai.defineTool(
    {
        name: 'getPreparationsTool',
        description: 'Récupère la liste de toutes les préparations (sous-recettes) disponibles.',
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional(),
        })),
    },
    async () => {
        try {
            const preparationsSnapshot = await getDocs(collection(db, 'preparations'));
            return preparationsSnapshot.docs.map(doc => {
                const data = doc.data() as Preparation;
                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                }
            });
        } catch (error) {
            console.error("Error fetching preparations for tool:", error);
            return [];
        }
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
        try {
            const ingredientsSnapshot = await getDocs(collection(db, 'ingredients'));
            return ingredientsSnapshot.docs.map(doc => {
                const data = doc.data() as Ingredient;
                return {
                    id: doc.id,
                    name: data.name,
                    category: data.category,
                    stockQuantity: data.stockQuantity,
                    lowStockThreshold: data.lowStockThreshold,
                    purchaseUnit: data.purchaseUnit,
                }
            });
        } catch (error) {
            console.error("Error fetching ingredients for tool:", error);
            return [];
        }
    }
);
