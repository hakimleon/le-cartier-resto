'use server';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Preparation, Ingredient, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { getConversionFactor, computeIngredientCost } from '@/utils/unitConverter';

type RequiredItem = { name: string; quantity: number; unit: string };
export type RequiredIngredient = RequiredItem & { totalCost: number };

export type ProductionPlan = {
    requiredPreparations: RequiredItem[];
    requiredIngredients: RequiredIngredient[];
    totalIngredientsCost: number;
    error: string | null;
};

// Helper function to safely add quantities, normalizing to a base unit
const addQuantities = (map: Map<string, RequiredItem>, id: string, newItem: RequiredItem, itemData?: Ingredient | Preparation) => {
    const existing = map.get(id);
    
    // Determine the most logical base unit for aggregation (g for weight, ml for volume)
    const volumeUnits = ['l', 'ml', 'cl'];
    const isVolume = volumeUnits.includes(newItem.unit.toLowerCase()) || (itemData && 'baseUnit' in itemData && itemData.baseUnit === 'ml');
    const baseUnit = isVolume ? 'ml' : 'g';

    const quantityInBaseUnit = newItem.quantity * getConversionFactor(newItem.unit, baseUnit, itemData);

    if (existing) {
        // If units are different, we need to convert the existing value before adding
        if (existing.unit !== baseUnit) {
            const existingInBaseUnit = existing.quantity * getConversionFactor(existing.unit, baseUnit, itemData);
            existing.quantity = existingInBaseUnit + quantityInBaseUnit;
            existing.unit = baseUnit;
        } else {
            existing.quantity += quantityInBaseUnit;
        }
    } else {
        map.set(id, { name: newItem.name, quantity: quantityInBaseUnit, unit: baseUnit });
    }
};


export async function calculateProductionPlan(forecast: Record<string, number>): Promise<ProductionPlan> {
    try {
        const [
            preparationsSnap,
            ingredientsSnap,
            recipeIngsSnap,
            recipePrepsSnap,
        ] = await Promise.all([
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks")),
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

        const processingQueue: { id: string, multiplier: number }[] = [];
        for (const dishId in forecast) {
            if (Object.prototype.hasOwnProperty.call(forecast, dishId)) {
                processingQueue.push({ id: dishId, multiplier: forecast[dishId] });
            }
        }
        
        const processedIds = new Set<string>();

        while (processingQueue.length > 0) {
            const { id, multiplier } = processingQueue.shift()!;
            
            // For dishes (initial items), we don't need to process them again if they appear as sub-recipes
            // but we do need to process their ingredients every time they are called for.
            const isDish = forecast[id] !== undefined;
            if (processedIds.has(id) && !isDish) {
                 //continue; // This would prevent re-calculating shared preps. We need to sum them up.
            }
            processedIds.add(id);

            const currentItemLinks = linksByParentId.get(id);
            if (!currentItemLinks) continue;

            for (const ingLink of currentItemLinks.ingredients) {
                const ingredient = allIngredients.get(ingLink.ingredientId);
                if (ingredient) {
                    const quantityToAdd = ingLink.quantity * multiplier;
                    addQuantities(totalIngredientsNeeded, ingredient.id!, { name: ingredient.name, quantity: quantityToAdd, unit: ingLink.unitUse }, ingredient);
                }
            }

            for (const prepLink of currentItemLinks.preparations) {
                const preparation = allPreparations.get(prepLink.childPreparationId);
                if (preparation) {
                    const quantityToAdd = prepLink.quantity * multiplier;
                    addQuantities(totalPreparationsNeeded, preparation.id!, { name: preparation.name, quantity: quantityToAdd, unit: prepLink.unitUse }, preparation);
                    
                    const quantityInProductionUnit = quantityToAdd * getConversionFactor(prepLink.unitUse, preparation.productionUnit || 'g', preparation);
                    const nextMultiplier = quantityInProductionUnit / (preparation.productionQuantity || 1);

                    if (nextMultiplier > 0) {
                        processingQueue.push({ id: preparation.id!, multiplier: nextMultiplier });
                    }
                }
            }
        }

        // Final formatting and cost calculation
        const formatQuantities = (items: RequiredItem[]): RequiredItem[] => {
            return items.map(item => {
                const unit = item.unit.toLowerCase();
                if ((unit === 'g' || unit === 'grammes') && item.quantity >= 1000) {
                    return { ...item, quantity: item.quantity / 1000, unit: 'kg' };
                }
                if ((unit === 'ml' || unit === 'millilitres') && item.quantity >= 1000) {
                    return { ...item, quantity: item.quantity / 1000, unit: 'L' };
                }
                return item;
            });
        };
        
        let totalIngredientsCost = 0;
        const ingredientsWithCost: RequiredIngredient[] = [];

        for (const [id, item] of totalIngredientsNeeded.entries()) {
            const ingredientData = allIngredients.get(id);
            if (ingredientData) {
                const { cost } = computeIngredientCost(ingredientData, item.quantity, item.unit);
                totalIngredientsCost += cost;
                ingredientsWithCost.push({ ...item, totalCost: cost });
            }
        }

        const formattedPreparations = formatQuantities(Array.from(totalPreparationsNeeded.values()));
        const formattedIngredients = formatQuantities(ingredientsWithCost) as RequiredIngredient[];


        return {
            requiredPreparations: formattedPreparations.sort((a,b) => a.name.localeCompare(b.name)),
            requiredIngredients: formattedIngredients.sort((a,b) => a.name.localeCompare(b.name)),
            totalIngredientsCost: totalIngredientsCost,
            error: null,
        };

    } catch (error) {
        console.error("Error in calculateProductionPlan:", error);
        return {
            requiredPreparations: [],
            requiredIngredients: [],
            totalIngredientsCost: 0,
            error: error instanceof Error ? `Erreur de calcul: ${error.message}` : "Une erreur inconnue est survenue lors du calcul.",
        };
    }
}
