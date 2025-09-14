
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient } from '@/lib/types';

export async function saveIngredient(ingredient: Omit<Ingredient, 'id'>, id: string | null): Promise<Ingredient> {
  // Ensure we are not saving deprecated fields
  const { name, category, stockQuantity, lowStockThreshold, supplier, purchasePrice, purchaseUnit, purchaseWeightGrams, yieldPercentage } = ingredient;
  const ingredientToSave: Omit<Ingredient, 'id'> = {
    name, category, stockQuantity, lowStockThreshold, supplier, purchasePrice, purchaseUnit, purchaseWeightGrams, yieldPercentage
  };

  let savedIngredient: Ingredient;

  if (id) {
    const ingredientDoc = doc(db, 'ingredients', id);
    await setDoc(ingredientDoc, ingredientToSave, { merge: true }); // Using merge to be safe, but it will overwrite with the clean object
    savedIngredient = { id, ...ingredientToSave };
  } else {
    const docRef = await addDoc(collection(db, 'ingredients'), ingredientToSave);
    savedIngredient = { id: docRef.id, ...ingredientToSave };
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

// NOTE: This is a one-time migration function. It's left here for reference.
// It would typically be run once by a developer.
export async function migrateIngredientsData() {
    const ingredientsCol = collection(db, 'ingredients');
    const snapshot = await getDocs(ingredientsCol);
    const batch = writeBatch(db);

    snapshot.forEach(doc => {
        const data = doc.data();
        // Check if migration is needed by looking for the old fields
        if (data.unitPrice !== undefined || data.unitPurchase !== undefined) {
            const docRef = doc.ref;
            const updateData: any = {
                // If new fields don't exist, try to populate from old ones
                purchasePrice: data.purchasePrice === undefined ? data.unitPrice : data.purchasePrice,
                purchaseUnit: data.purchaseUnit === undefined ? data.unitPurchase : data.purchaseUnit,
                // Add default purchaseWeightGrams based on the unit if it doesn't exist
                purchaseWeightGrams: data.purchaseWeightGrams === undefined ? 
                    (data.unitPurchase?.toLowerCase() === 'kg' ? 1000 : 
                     data.unitPurchase?.toLowerCase() === 'l' ? 1000 : 1) 
                    : data.purchaseWeightGrams,
                yieldPercentage: data.yieldPercentage === undefined ? 100 : data.yieldPercentage,
                
                // Fields to be deleted
                unitPrice: undefined,
                unitPurchase: undefined,
                finalUseUnit: undefined,
                convertedQuantity: undefined,
            };

            // This is a way to delete fields with writeBatch
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                    batch.update(docRef, { [key]: undefined });
                }
            });

            batch.set(docRef, updateData, { merge: true });
        }
    });

    try {
        await batch.commit();
        console.log(`Migration successful for ${snapshot.size} documents.`);
        return { success: true, count: snapshot.size };
    } catch (e) {
        console.error("Migration failed: ", e);
        return { success: false, error: e };
    }
}
