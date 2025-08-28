'use server';

import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function saveIngredient(ingredient: Omit<Ingredient, 'id'>, id: string | null) {
  if (id) {
    // Update existing document
    const ingredientDoc = doc(db, 'ingredients', id);
    await setDoc(ingredientDoc, ingredient, { merge: true });
  } else {
    // Create new document
    await addDoc(collection(db, 'ingredients'), ingredient);
  }
  revalidatePath('/ingredients');
}

export async function deleteIngredient(id: string) {
  if (!id) {
    throw new Error("L'identifiant est requis pour la suppression.");
  }
  const ingredientDoc = doc(db, 'ingredients', id);
  await deleteDoc(ingredientDoc);
  revalidatePath('/ingredients');
}
