
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
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
