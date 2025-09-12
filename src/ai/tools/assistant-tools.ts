

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


// Helper function to calculate cost for a single recipe/preparation entity
const calculateEntityCost = async (
    entityId: string, 
    allIngredients: Ingredient[], 
    preparationCosts: Record<string, number>, // Pre-calculated costs of all preparations
    allPreparations: Preparation[]
): Promise<number> => {
    let totalCost = 0;

    // Fetch and calculate cost of direct ingredients
    const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", entityId));
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

    // Fetch and add cost of sub-preparations
    const preparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", entityId));
    const preparationsSnap = await getDocs(preparationsQuery);
    for (const prepDoc of preparationsSnap.docs) {
        const link = prepDoc.data() as RecipePreparationLink;
        const prepCostPerUnit = preparationCosts[link.childPreparationId];
        const prepData = allPreparations.find(p => p.id === link.childPreparationId);

        if (prepCostPerUnit !== undefined && prepData) {
             const u = (unit: string) => unit.toLowerCase().trim();
             const factors: Record<string, number> = { 'kg': 1000, 'g': 1, 'l': 1000, 'ml': 1, 'pièce': 1, 'piece': 1 };
             const toFactor = factors[u(prepData.productionUnit)] || 1;
             const fromFactor = factors[u(link.unitUse)] || 1;
             const conversionFactor = fromFactor / toFactor;
             totalCost += (link.quantity || 0) * prepCostPerUnit * conversionFactor;
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
        try {
            // 1. Pre-fetch all base data
            const ingredientsSnap = await getDocs(collection(db, "ingredients"));
            const allIngredients = ingredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));

            const preparationsSnap = await getDocs(collection(db, "preparations"));
            const allPreparations = preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));

            // 2. Calculate costs for all preparations first (handling potential dependencies)
            const preparationCosts: Record<string, number> = {};
            // This is a simplified calculation loop. For deep dependencies, a topological sort would be more robust.
            // However, for most restaurant use cases, dependency depth is shallow.
            for (const prep of allPreparations) {
                const prepIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", prep.id!));
                const prepIngredientsSnap = await getDocs(prepIngredientsQuery);
                let prepTotalCost = 0;
                prepIngredientsSnap.forEach(doc => {
                    const link = doc.data() as RecipeIngredientLink;
                    const ingData = allIngredients.find(i => i.id === link.ingredientId);
                    if (ingData) {
                         const isUnitBased = ['pièce', 'piece'].includes(ingData.purchaseUnit.toLowerCase());
                        if (isUnitBased) {
                             prepTotalCost += (link.quantity || 0) * (ingData.purchasePrice || 0);
                        } else if (ingData.purchasePrice && ingData.purchaseWeightGrams) {
                            const costPerGram = ingData.purchasePrice / ingData.purchaseWeightGrams;
                            const netCostPerGram = costPerGram / ((ingData.yieldPercentage || 100) / 100);
                            const u = (unit: string) => unit.toLowerCase().trim();
                            const factors: Record<string, number> = { 'kg': 1000, 'g': 1, 'l': 1000, 'ml': 1 };
                            const conversionFactor = factors[u(link.unitUse)] || 1;
                            prepTotalCost += (link.quantity || 0) * conversionFactor * netCostPerGram;
                        }
                    }
                });
                preparationCosts[prep.id!] = prep.productionQuantity > 0 ? prepTotalCost / prep.productionQuantity : 0;
            }


            // 3. Fetch all dishes
            const recipesQuery = query(collection(db, "recipes"), where("type", "==", "Plat"));
            const recipesSnapshot = await getDocs(recipesQuery);
            
            const recipesWithDetails = await Promise.all(recipesSnapshot.docs.map(async (recipeDoc) => {
                const recipe = recipeDoc.data() as Recipe;
                
                // 4. Calculate final cost for each dish using the pre-calculated preparation costs
                const totalCost = await calculateEntityCost(recipeDoc.id, allIngredients, preparationCosts, allPreparations);
                const costPerPortion = recipe.portions > 0 ? totalCost / recipe.portions : 0;

                // Get ingredient names for the current recipe
                const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", recipeDoc.id));
                const ingredientsLinksSnap = await getDocs(ingredientsQuery);
                const ingredientNames = ingredientsLinksSnap.docs.map(linkDoc => {
                    const link = linkDoc.data() as RecipeIngredientLink;
                    return allIngredients.find(i => i.id === link.ingredientId)?.name;
                }).filter((name): name is string => !!name);

                // Get preparation names for the current recipe
                const preparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", recipeDoc.id));
                const preparationsLinksSnap = await getDocs(preparationsQuery);
                const preparationNames = preparationsLinksSnap.docs.map(linkDoc => {
                    const link = linkDoc.data() as RecipePreparationLink;
                    return allPreparations.find(p => p.id === link.childPreparationId)?.name;
                }).filter((name): name is string => !!name);

                return {
                    id: recipeDoc.id,
                    name: recipe.name,
                    category: recipe.category,
                    price: recipe.price,
                    costPerPortion: costPerPortion,
                    portions: recipe.portions,
                    status: recipe.status,
                    ingredients: ingredientNames,
                    preparations: preparationNames,
                };
            }));

            return recipesWithDetails;
        } catch (error) {
            console.error("Error fetching recipes for tool:", error);
            return [];
        }
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
        try {
            const ingredientsSnap = await getDocs(collection(db, "ingredients"));
            const allIngredients = ingredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));

            const preparationsSnapshot = await getDocs(collection(db, 'preparations'));
            const allPreparations = preparationsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));

            return await Promise.all(allPreparations.map(async (prep) => {
                 // Get ingredient names for the current preparation
                const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", prep.id));
                const ingredientsLinksSnap = await getDocs(ingredientsQuery);
                const ingredientNames = ingredientsLinksSnap.docs.map(linkDoc => {
                    const link = linkDoc.data() as RecipeIngredientLink;
                    return allIngredients.find(i => i.id === link.ingredientId)?.name;
                }).filter((name): name is string => !!name);

                 // Get sub-preparation names for the current preparation
                const preparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", prep.id));
                const preparationsLinksSnap = await getDocs(preparationsQuery);
                const preparationNames = preparationsLinksSnap.docs.map(linkDoc => {
                    const link = linkDoc.data() as RecipePreparationLink;
                    return allPreparations.find(p => p.id === link.childPreparationId)?.name;
                }).filter((name): name is string => !!name);

                return {
                    id: prep.id!,
                    name: prep.name,
                    description: prep.description,
                    productionQuantity: prep.productionQuantity,
                    productionUnit: prep.productionUnit,
                    ingredients: ingredientNames,
                    preparations: preparationNames,
                }
            }));
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

    

    

    
