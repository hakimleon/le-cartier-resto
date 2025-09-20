
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient } from '@/lib/types';

export async function saveIngredient(ingredient: Omit<Ingredient, 'id'>, id: string | null): Promise<Ingredient> {
  const { name, category, stockQuantity, lowStockThreshold, supplier, purchasePrice, purchaseUnit, purchaseWeightGrams, yieldPercentage, isGeneric, genericIngredientId } = ingredient;
  
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
    isGeneric,
    // La correction est ici : on n'inclut genericIngredientId que si l'ingrédient N'EST PAS générique.
    ...(!isGeneric && { genericIngredientId: genericIngredientId || undefined })
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

  // 1. Find all variants that reference this generic ingredient and unlink them
  const variantsQuery = query(collection(db, "ingredients"), where("genericIngredientId", "==", id));
  const variantsSnapshot = await getDocs(variantsQuery);
  variantsSnapshot.forEach(doc => {
      batch.update(doc.ref, { genericIngredientId: "" }); // Or set to null/delete the field
  });

  // 2. Delete the ingredient itself
  const ingredientDoc = doc(db, 'ingredients', id);
  batch.delete(ingredientDoc);

  await batch.commit();
}
