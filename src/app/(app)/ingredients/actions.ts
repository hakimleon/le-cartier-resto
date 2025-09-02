
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
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
  // No revalidation needed, onSnapshot handles updates on the client
}
