
'use server';

import { collection, doc, writeBatch, query, where, getDocs, serverTimestamp, getDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Table, Recipe, Preparation, RecipeIngredientLink, RecipePreparationLink, Ingredient } from "@/lib/types";

// Helper pour récupérer tous les ingrédients et sous-préparations d'une recette
async function getFullRecipeComposition(recipeId: string, quantityMultiplier: number): Promise<Map<string, number>> {
    const ingredientDeductions = new Map<string, number>();

    // File pour traiter les préparations de manière récursive
    const preparationsToProcess = [{ id: recipeId, multiplier: quantityMultiplier }];
    const processedPreparations = new Set<string>();

    while (preparationsToProcess.length > 0) {
        const { id, multiplier } = preparationsToProcess.shift()!;

        if (processedPreparations.has(id)) {
            continue; // Éviter les boucles infinies
        }
        processedPreparations.add(id);

        // 1. Déduire les ingrédients directs de la recette/préparation actuelle
        const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", id));
        const ingredientsSnap = await getDocs(ingredientsQuery);

        for (const ingredientDoc of ingredientsSnap.docs) {
            const link = ingredientDoc.data() as RecipeIngredientLink;
            const currentQuantity = ingredientDeductions.get(link.ingredientId) || 0;
            ingredientDeductions.set(link.ingredientId, currentQuantity + (link.quantity * multiplier));
        }

        // 2. Ajouter les sous-préparations à la file de traitement
        const prepsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", id));
        const prepsSnap = await getDocs(prepsQuery);
        
        for (const prepDoc of prepsSnap.docs) {
            const link = prepDoc.data() as RecipePreparationLink;
            
            // Pour déduire correctement, il faut savoir combien de "portions" de la sous-recette on utilise
            const childPrepDoc = await getDoc(doc(db, "preparations", link.childPreparationId));
            if (childPrepDoc.exists()) {
                const childPrepData = childPrepDoc.data() as Preparation;
                // Calculer le multiplicateur pour les ingrédients de la sous-recette
                // ex: si on a besoin de 200g de sauce et que la recette produit 1000g, le multiplicateur est 0.2
                const productionQuantity = childPrepData.productionQuantity || 1;
                const newMultiplier = (link.quantity / productionQuantity) * multiplier;
                
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
export async function processOrder(table: Table) {
    if (!table || table.currentOrder.length === 0) {
        throw new Error("La commande est vide.");
    }

    const aggregatedDeductions = new Map<string, number>();

    // Agréger les déductions pour toute la commande
    for (const item of table.currentOrder) {
        const composition = await getFullRecipeComposition(item.dishId, item.quantity);
        for (const [ingredientId, quantity] of composition.entries()) {
            const currentTotal = aggregatedDeductions.get(ingredientId) || 0;
            aggregatedDeductions.set(ingredientId, currentTotal + quantity);
        }
    }

    try {
        // Utiliser une transaction pour assurer la cohérence des données
        await runTransaction(db, async (transaction) => {
            // 1. Déduire les ingrédients du stock
            for (const [ingredientId, quantityToDeduct] of aggregatedDeductions.entries()) {
                const ingredientRef = doc(db, "ingredients", ingredientId);
                const ingredientSnap = await transaction.get(ingredientRef);

                if (!ingredientSnap.exists()) {
                    throw new Error(`L'ingrédient avec l'ID ${ingredientId} n'a pas été trouvé.`);
                }

                const ingredientData = ingredientSnap.data() as Ingredient;
                
                // Convertir la quantité déduite (en g/ml) en unité d'achat
                const purchaseUnitInGrams = ingredientData.purchaseWeightGrams || 1;
                const deductionInPurchaseUnits = quantityToDeduct / purchaseUnitInGrams;

                const newStock = (ingredientData.stockQuantity || 0) - deductionInPurchaseUnits;

                transaction.update(ingredientRef, { stockQuantity: newStock });
            }

            // 2. Enregistrer la vente
            const saleRef = doc(collection(db, "sales"));
            transaction.set(saleRef, {
                tableId: table.id,
                items: table.currentOrder,
                total: table.total,
                createdAt: serverTimestamp(),
            });
        });

    } catch (error) {
        console.error("Transaction a échoué: ", error);
        if (error instanceof Error) {
            throw new Error(`La transaction a échoué : ${error.message}`);
        }
        throw new Error("Une erreur inconnue est survenue lors du traitement de la commande.");
    }
}
