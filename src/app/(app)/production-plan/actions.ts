
'use server';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Preparation, Ingredient, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { getConversionFactor } from '@/utils/unitConverter';

type RequiredItem = { name: string; quantity: number; unit: string };
export type ProductionPlan = {
    requiredPreparations: RequiredItem[];
    requiredIngredients: RequiredItem[];
    error: string | null;
};

// Helper function to safely add quantities
const addQuantities = (map: Map<string, RequiredItem>, id: string, newItem: RequiredItem, item?: Ingredient | Preparation) => {
    if (map.has(id)) {
        const existing = map.get(id)!;
        // Convert new item's quantity to the existing item's unit before adding
        const conversionFactor = getConversionFactor(newItem.unit, existing.unit, item);
        existing.quantity += newItem.quantity * conversionFactor;
    } else {
        // If it's a new item, just add it to the map
        map.set(id, { ...newItem });
    }
};


export async function calculateProductionPlan(forecast: Record<string, number>): Promise<ProductionPlan> {
    try {
        const [
            preparationsSnap,
            ingredientsSnap,
            recipeIngsSnap,
            recipePrepsSnap,
            activeDishesSnap
        ] = await Promise.all([
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks")),
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
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
        
        while (processingQueue.length > 0) {
            const { id, multiplier } = processingQueue.shift()!;

            const currentItemLinks = linksByParentId.get(id);
            if (!currentItemLinks) continue;

            // Process direct ingredients of the current item
            for (const ingLink of currentItemLinks.ingredients) {
                const ingredient = allIngredients.get(ingLink.ingredientId);
                if (ingredient) {
                    const quantityToAdd = ingLink.quantity * multiplier;
                    addQuantities(totalIngredientsNeeded, ingredient.id!, { name: ingredient.name, quantity: quantityToAdd, unit: ingLink.unitUse }, ingredient);
                }
            }

            // Process sub-preparations of the current item
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
        
        const formatQuantities = (items: RequiredItem[]): RequiredItem[] => {
            return items.map(item => {
                const unit = item.unit.toLowerCase();
                if ((unit === 'g' || unit === 'grammes') && item.quantity >= 1000) {
                    return { ...item, quantity: item.quantity / 1000, unit: 'kg' };
                }
                if ((unit === 'ml' || unit === 'millilitres') && item.quantity >= 1000) {
                    return { ...item, quantity: item.quantity / 1000, unit: 'l' };
                }
                return item;
            });
        };

        const finalPreparations = formatQuantities(Array.from(totalPreparationsNeeded.values()));
        const finalIngredients = formatQuantities(Array.from(totalIngredientsNeeded.values()));

        return {
            requiredPreparations: finalPreparations.sort((a,b) => a.name.localeCompare(b.name)),
            requiredIngredients: finalIngredients.sort((a,b) => a.name.localeCompare(b.name)),
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
