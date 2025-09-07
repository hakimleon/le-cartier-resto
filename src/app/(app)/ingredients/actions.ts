
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient } from '@/lib/types';

export async function saveIngredient(ingredient: Omit<Ingredient, 'id'>, id: string | null): Promise<Ingredient> {
  let savedIngredient: Ingredient;

  if (id) {
    // Update existing document
    const ingredientDoc = doc(db, 'ingredients', id);
    await setDoc(ingredientDoc, ingredient, { merge: true });
    savedIngredient = { id, ...ingredient };
  } else {
    // Create new document
    const docRef = await addDoc(collection(db, 'ingredients'), ingredient);
    savedIngredient = { id: docRef.id, ...ingredient };
  }
  
  return savedIngredient;
}

export async function deleteIngredient(id: string) {
  if (!id) {
    throw new Error("L'identifiant est requis pour la suppression.");
  }
  const ingredientDoc = doc(db, 'ingredients', id);
  await deleteDoc(ingredientDoc);
}

/**
 * Migrates old ingredient data structure to the new one.
 * @returns The number of ingredients updated.
 */
export async function migrateIngredientsData(): Promise<number> {
  try {
    const ingredientsRef = collection(db, 'ingredients');
    const q = query(ingredientsRef);
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    let updatedCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data() as any; // Use 'any' to access old and new fields

      // Check if this ingredient needs migration
      // We assume if purchasePrice is missing, it's the old format.
      if (data.unitPrice !== undefined && data.purchasePrice === undefined) {
        
        let purchaseUnit = data.unitPurchase || 'kg';
        let purchaseWeightGrams = 1000;

        if (purchaseUnit === 'L' || purchaseUnit === 'litres') {
            purchaseUnit = 'litres';
            purchaseWeightGrams = 1000;
        } else if (purchaseUnit === 'g') {
            purchaseUnit = 'grammes';
            purchaseWeightGrams = 1;
        } else if (purchaseUnit === 'ml') {
            purchaseUnit = 'ml';
            purchaseWeightGrams = 1;
        } else if (purchaseUnit === 'pièce' || purchaseUnit === 'piece') {
            purchaseUnit = 'pièce';
            // We can't know the weight, so we default to 100g, user should adjust
            purchaseWeightGrams = data.purchaseWeightGrams || 100;
        } else {
            // Default for kg or unknown
            purchaseUnit = 'kg';
            purchaseWeightGrams = 1000;
        }

        batch.update(doc.ref, {
          purchasePrice: data.unitPrice,
          purchaseUnit: purchaseUnit,
          purchaseWeightGrams: purchaseWeightGrams,
          yieldPercentage: 100, // Default yield
          // Set old fields to null/undefined if you want to clean them up
          // unitPrice: deleteField(), 
          // unitPurchase: deleteField() 
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${updatedCount} ingredients.`);
    } else {
      console.log("No ingredients needed migration.");
    }
    
    return updatedCount;
  } catch (error) {
    console.error("Error migrating ingredients: ", error);
    if (error instanceof Error) {
        throw new Error(`Failed to migrate ingredients: ${error.message}`);
    }
    throw new Error("An unknown error occurred during ingredient migration.");
  }
}
