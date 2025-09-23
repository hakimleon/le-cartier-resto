
'use server';

import { collection, doc, writeBatch, query, where, getDocs, serverTimestamp, getDoc, runTransaction, DocumentData, DocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Table, Recipe, Preparation, RecipeIngredientLink, RecipePreparationLink, Ingredient } from "@/lib/types";

// Helper pour convertir les unités de manière plus robuste
const getConversionFactor = (fromUnit: string | undefined, toUnit: string | undefined): number => {
    if (!fromUnit || !toUnit || fromUnit.toLowerCase().trim() === toUnit.toLowerCase().trim()) return 1;

    const u = (unit: string) => unit.toLowerCase().trim();
    const factors: Record<string, number> = {
        'kg': 1000, 'g': 1, 'mg': 0.001,
        'l': 1000, 'ml': 1, 'cl': 10,
        'litre': 1000, 'litres': 1000,
        'pièce': 1, 'piece': 1, 'botte': 1,
    };
    
    const fromFactor = factors[u(fromUnit)];
    const toFactor = factors[u(toUnit)];

    if (fromFactor !== undefined && toFactor !== undefined) {
        const weightUnits = ['kg', 'g', 'mg'];
        const volumeUnits = ['l', 'ml', 'cl', 'litre', 'litres'];
        
        const fromInWeight = weightUnits.includes(u(fromUnit));
        const toInWeight = weightUnits.includes(u(toUnit));
        const fromInVolume = volumeUnits.includes(u(fromUnit));
        const toInVolume = volumeUnits.includes(u(toUnit));

        if ((fromInWeight && toInVolume) || (fromInVolume && toInWeight)) {
             // Assumption 1ml approx 1g for most kitchen ingredients
             return fromFactor / toFactor;
        }

        if ((fromInWeight && toInWeight) || (fromInVolume && toInVolume)) {
            return fromFactor / toFactor;
        }
    }
    
    return 1;
};


async function getFullRecipeComposition(
    recipeId: string, 
    quantityMultiplier: number,
    allPreparations: Map<string, Preparation>,
    allIngredients: Map<string, Ingredient>,
    allRecipeIngredients: Map<string, RecipeIngredientLink[]>,
    allRecipePreps: Map<string, RecipePreparationLink[]>
): Promise<Map<string, number>> {
    const ingredientDeductions = new Map<string, number>();
    const preparationsToProcess = [{ id: recipeId, multiplier: quantityMultiplier }];
    const processedPreparations = new Set<string>();

    while (preparationsToProcess.length > 0) {
        const { id, multiplier } = preparationsToProcess.shift()!;

        if (processedPreparations.has(id)) {
            continue; 
        }
        processedPreparations.add(id);

        const ingredientsLinks = allRecipeIngredients.get(id) || [];
        for (const link of ingredientsLinks) {
            const currentQuantity = ingredientDeductions.get(link.ingredientId) || 0;
            ingredientDeductions.set(link.ingredientId, currentQuantity + (link.quantity * multiplier));
        }

        const prepsLinks = allRecipePreps.get(id) || [];
        for (const link of prepsLinks) {
            const childPrepData = allPreparations.get(link.childPreparationId);
            if (childPrepData) {
                const productionQuantity = childPrepData.productionQuantity || 1;
                const conversionFactor = getConversionFactor(childPrepData.usageUnit, link.unitUse) || 1;
                const newMultiplier = (link.quantity * conversionFactor / productionQuantity) * multiplier;

                preparationsToProcess.push({ id: link.childPreparationId, multiplier: newMultiplier });
            }
        }
    }
    
    return ingredientDeductions;
}

/**
 * Traite une commande, enregistre la vente et déduit les ingrédients du stock.
 * @param table - L'objet table contenant la commande à traiter.
 */
export async function processOrder(table: Table): Promise<{success: boolean, message: string}> {
    if (!table || table.currentOrder.length === 0) {
        throw new Error("La commande est vide.");
    }
    
    try {
        // Pré-chargement de toutes les données nécessaires pour éviter les appels multiples dans la boucle
        const [prepsSnap, ingredientsSnap, recipeIngsSnap, recipePrepsSnap] = await Promise.all([
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks"))
        ]);

        const allPreparations = new Map(prepsSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Preparation]));
        const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Ingredient]));
        
        const allRecipeIngredients = new Map<string, RecipeIngredientLink[]>();
        recipeIngsSnap.forEach(doc => {
            const link = doc.data() as RecipeIngredientLink;
            if (!allRecipeIngredients.has(link.recipeId)) {
                allRecipeIngredients.set(link.recipeId, []);
            }
            allRecipeIngredients.get(link.recipeId)!.push(link);
        });

        const allRecipePreps = new Map<string, RecipePreparationLink[]>();
        recipePrepsSnap.forEach(doc => {
            const link = doc.data() as RecipePreparationLink;
            if (!allRecipePreps.has(link.parentRecipeId)) {
                allRecipePreps.set(link.parentRecipeId, []);
            }
            allRecipePreps.get(link.parentRecipeId)!.push(link);
        });


        const aggregatedDeductions = new Map<string, number>();

        for (const item of table.currentOrder) {
            const composition = await getFullRecipeComposition(item.dishId, item.quantity, allPreparations, allIngredients, allRecipeIngredients, allRecipePreps);
            for (const [ingredientId, quantity] of composition.entries()) {
                const currentTotal = aggregatedDeductions.get(ingredientId) || 0;
                aggregatedDeductions.set(ingredientId, currentTotal + quantity);
            }
        }

        await runTransaction(db, async (transaction) => {
            const ingredientRefs = new Map<string, DocumentSnapshot>();
            const promises = [];
            for (const ingredientId of aggregatedDeductions.keys()) {
                const ingredientRef = doc(db, "ingredients", ingredientId);
                promises.push(transaction.get(ingredientRef).then(doc => ingredientRefs.set(ingredientId, doc)));
            }
            await Promise.all(promises);

            for (const [ingredientId, quantityToDeduct] of aggregatedDeductions.entries()) {
                const ingredientSnap = ingredientRefs.get(ingredientId);

                if (!ingredientSnap || !ingredientSnap.exists()) {
                    throw new Error(`L'ingrédient avec l'ID ${ingredientId} n'a pas été trouvé.`);
                }

                const ingredientData = ingredientSnap.data() as Ingredient;
                const ingredientRef = doc(db, "ingredients", ingredientId);

                const purchaseUnitInGrams = ingredientData.purchaseWeightGrams || 1;
                const conversionToBaseUnit = getConversionFactor(ingredientData.purchaseUnit, 'g');

                const stockInGrams = (ingredientData.stockQuantity || 0) * purchaseUnitInGrams * conversionToBaseUnit;
                const newStockInGrams = stockInGrams - quantityToDeduct;

                if (newStockInGrams < 0) {
                   console.warn(`Stock insuffisant pour ${ingredientData.name}. Actuel: ${stockInGrams.toFixed(2)}g, Requis: ${quantityToDeduct.toFixed(2)}g. Le stock deviendra négatif.`);
                }
                
                const newStockInPurchaseUnits = newStockInGrams / (purchaseUnitInGrams * conversionToBaseUnit);

                transaction.update(ingredientRef, { stockQuantity: newStockInPurchaseUnits });
            }

            const saleRef = doc(collection(db, "sales"));
            transaction.set(saleRef, {
                tableId: table.id,
                items: table.currentOrder,
                total: table.total,
                createdAt: serverTimestamp(),
            });
        });

        return { success: true, message: "Commande validée et stock mis à jour." };

    } catch (error) {
        console.error("La transaction de la commande a échoué: ", error);
        if (error instanceof Error) {
            return { success: false, message: `Erreur: ${error.message}` };
        }
        return { success: false, message: "Une erreur inconnue est survenue." };
    }
}
