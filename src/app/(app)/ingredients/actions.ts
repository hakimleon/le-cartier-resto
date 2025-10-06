
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient } from '@/lib/types';

export async function saveIngredient(ingredient: Partial<Omit<Ingredient, 'id'>>, id: string | null): Promise<Ingredient> {
  
  const dataToSave: Partial<Ingredient> = {
    name: ingredient.name,
    category: ingredient.category,
    stockQuantity: ingredient.stockQuantity,
    lowStockThreshold: ingredient.lowStockThreshold,
    supplier: ingredient.supplier,
    purchasePrice: ingredient.purchasePrice,
    purchaseUnit: ingredient.purchaseUnit,
    purchaseWeightGrams: ingredient.purchaseWeightGrams,
    yieldPercentage: ingredient.yieldPercentage,
    baseUnit: ingredient.baseUnit || 'g',
    equivalences: ingredient.equivalences || {},
  };

  let savedIngredient: Ingredient;

  if (id) {
    const ingredientDoc = doc(db, 'ingredients', id);
    await setDoc(ingredientDoc, dataToSave, { merge: true });
    savedIngredient = { id, ...dataToSave } as Ingredient;
  } else {
    const docRef = await addDoc(collection(db, 'ingredients'), dataToSave);
    savedIngredient = { id: docRef.id, ...dataToSave } as Ingredient;
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
