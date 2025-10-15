
'use server';

import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Preparation, Ingredient, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { getConversionFactor } from '@/utils/unitConverter';

type RequiredItem = { name: string; quantity: number; unit: string };
export type ProductionPlan = {
    requiredPreparations: RequiredItem[];
    requiredIngredients: RequiredItem[];
    error: string | null;
};

// Helper function to safely add quantities, requires a base unit conversion logic
const addQuantities = (map: Map<string, RequiredItem>, id: string, newItem: RequiredItem) => {
    if (map.has(id)) {
        const existing = map.get(id)!;
        // This is a simplified aggregation. A real-world app would convert to a base unit (e.g., grams) before adding.
        // For now, we assume units are compatible or we just add them up which might not be accurate.
        // A better approach would be to implement a robust unit conversion system.
        if (existing.unit.toLowerCase() === newItem.unit.toLowerCase()) {
            existing.quantity += newItem.quantity;
        } else {
            // Attempt to convert to existing unit. If not possible, this might lead to inaccurate sums.
            // For this version, we will assume getConversionFactor handles it reasonably.
            const conversionFactor = getConversionFactor(newItem.unit, existing.unit, undefined);
            existing.quantity += newItem.quantity * conversionFactor;
        }
    } else {
        map.set(id, { ...newItem });
    }
};


export async function calculateProductionPlan(forecast: Record<string, number>): Promise<ProductionPlan> {
    try {
        const [
            preparationsSnap,
            ingredientsSnap,
            recipeIngsSnap,
            recipePrepsSnap
        ] = await Promise.all([
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks"))
        ]);
        
        const allPreparations = new Map(preparationsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Preparation]));
        const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Ingredient]));
        
        const linksByParentId = new Map<string, { ingredients: RecipeIngredientLink[], preparations: RecipePreparationLink[] }>();

        recipeIngsSnap.forEach(doc => {
            const link = doc.data() as RecipeIngredientLink;
            if (!linksByParentId.has(link.recipeId)) linksByParentId.set(link.recipeId, { ingredients: [], preparations: [] });
            linksByParentId.get(link.recipeId)!.ingredients.push(link);
        });
        recipePrepsSnap.forEach(doc => {
            const link = doc.data() as RecipePreparationLink;
            if (!linksByParentId.has(link.parentRecipeId)) linksByParentId.set(link.parentRecipeId, { ingredients: [], preparations: [] });
            linksByParentId.get(link.parentRecipeId)!.preparations.push(link);
        });

        const totalPreparationsNeeded = new Map<string, RequiredItem>();
        const totalIngredientsNeeded = new Map<string, RequiredItem>();

        const processingQueue: { id: string, multiplier: number }[] = Object.entries(forecast).map(([dishId, quantity]) => ({ id: dishId, multiplier: quantity }));
        
        const processed = new Set<string>();

        while (processingQueue.length > 0) {
            const { id, multiplier } = processingQueue.shift()!;
            
            // Basic circular dependency check
            if (processed.has(id)) continue;
            processed.add(id);

            const currentItemLinks = linksByParentId.get(id);
            if (!currentItemLinks) continue;

            // Process direct ingredients of the current item
            for (const ingLink of currentItemLinks.ingredients) {
                const ingredient = allIngredients.get(ingLink.ingredientId);
                if (ingredient) {
                    const quantityToAdd = ingLink.quantity * multiplier;
                    addQuantities(totalIngredientsNeeded, ingredient.id!, { name: ingredient.name, quantity: quantityToAdd, unit: ingLink.unitUse });
                }
            }

            // Process sub-preparations of the current item
            for (const prepLink of currentItemLinks.preparations) {
                const preparation = allPreparations.get(prepLink.childPreparationId);
                if (preparation) {
                    const quantityToAdd = prepLink.quantity * multiplier;
                    addQuantities(totalPreparationsNeeded, preparation.id!, { name: preparation.name, quantity: quantityToAdd, unit: prepLink.unitUse });
                    
                    // Calculate the new multiplier for the next level down the dependency tree
                    // The multiplier represents how many "full recipes" of the sub-preparation are needed.
                    const quantityInProductionUnit = quantityToAdd * getConversionFactor(prepLink.unitUse, preparation.productionUnit || 'g', undefined);
                    const nextMultiplier = quantityInProductionUnit / (preparation.productionQuantity || 1);

                    if (nextMultiplier > 0) {
                        processingQueue.push({ id: preparation.id!, multiplier: nextMultiplier });
                    }
                }
            }
             processed.delete(id); // Allow reprocessing for different branches of the plan
        }
        
        return {
            requiredPreparations: Array.from(totalPreparationsNeeded.values()).sort((a,b) => a.name.localeCompare(b.name)),
            requiredIngredients: Array.from(totalIngredientsNeeded.values()).sort((a,b) => a.name.localeCompare(b.name)),
            error: null,
        };

    } catch (error) {
        console.error("Error in calculateProductionPlan:", error);
        return {
            requiredPreparations: [],
            requiredIngredients: [],
            error: error instanceof Error ? `Erreur de calcul: ${error.message}` : "Une erreur inconnue est survenue lors du calcul.",
        };
    }
}
