
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient } from '@/lib/types';

export async function saveIngredient(ingredient: Omit<Ingredient, 'id'>, id: string | null): Promise<Ingredient> {
  const { name, category, stockQuantity, lowStockThreshold, supplier, purchasePrice, purchaseUnit, purchaseWeightGrams, yieldPercentage } = ingredient;
  
  const ingredientToSave: Omit<Ingredient, 'id'> = {
    name, 
    category, 
    stockQuantity, 
    lowStockThreshold, 
    supplier, 
    purchasePrice, 
    purchaseUnit, 
    purchaseWeightGrams, 
    yieldPercentage, 
  };

  let savedIngredient: Ingredient;

  if (id) {
    const ingredientDoc = doc(db, 'ingredients', id);
    await setDoc(ingredientDoc, ingredientToSave, { merge: true });
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

  const batch = writeBatch(db);

  // 1. Find all `recipeIngredients` links that use this ingredient and delete them
  const linksQuery = query(collection(db, "recipeIngredients"), where("ingredientId", "==", id));
  const linksSnapshot = await getDocs(linksQuery);
  linksSnapshot.forEach(doc => {
      console.log(`Suppression du lien d'ingrédient ${doc.id} pointant vers l'ingrédient supprimé.`);
      batch.delete(doc.ref);
  });

  // 2. Delete the ingredient itself
  const ingredientDoc = doc(db, 'ingredients', id);
  batch.delete(ingredientDoc);

  await batch.commit();
}

/**
 * Migrates all ingredients in the database to include the new `baseUnit` and `equivalences` fields.
 * This is a one-time operation.
 */
export async function migrateIngredientsToNewStructure(): Promise<{success: boolean, message: string, updatedCount: number}> {
    try {
        const ingredientsQuery = query(collection(db, "ingredients"));
        const querySnapshot = await getDocs(ingredientsQuery);

        if (querySnapshot.empty) {
            return { success: true, message: "Aucun ingrédient à migrer.", updatedCount: 0 };
        }

        const batch = writeBatch(db);
        let updatedCount = 0;

        querySnapshot.forEach(doc => {
            const ingredient = doc.data() as Partial<Ingredient & { baseUnit?: any; equivalences?: any }>;
            
            // Check if migration is needed for this document
            if (ingredient.baseUnit === undefined || ingredient.equivalences === undefined) {
                const dataToUpdate: any = {};

                if (ingredient.baseUnit === undefined) {
                    dataToUpdate.baseUnit = 'g'; // Default to 'g'
                }
                 if (ingredient.equivalences === undefined) {
                    dataToUpdate.equivalences = {}; // Default to an empty object
                }
                
                batch.update(doc.ref, dataToUpdate);
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            return { success: true, message: `Migration réussie. ${updatedCount} ingrédients ont été mis à jour.`, updatedCount };
        }

        return { success: true, message: "Tous les ingrédients sont déjà à jour.", updatedCount: 0 };

    } catch (error) {
        console.error("Erreur lors de la migration des ingrédients :", error);
        if (error instanceof Error) {
            return { success: false, message: error.message, updatedCount: 0 };
        }
        return { success: false, message: "Une erreur inconnue est survenue.", updatedCount: 0 };
    }
}
