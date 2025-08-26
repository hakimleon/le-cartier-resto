
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/lib/types';

export async function saveDish(recipe: Omit<Recipe, 'id'>, id: string | null) {
  if (id) {
    // Update existing document
    const recipeDoc = doc(db, 'recipes', id);
    await setDoc(recipeDoc, recipe, { merge: true });
  } else {
    // Create new document
    await addDoc(collection(db, 'recipes'), recipe);
  }
}

export async function deleteDish(id: string) {
  if (!id) {
    throw new Error("L'identifiant est requis pour la suppression.");
  }
  const recipeDoc = doc(db, 'recipes', id);
  await deleteDoc(recipeDoc);
}

export async function deleteRecipeIngredient(recipeIngredientId: string) {
  if (!recipeIngredientId) {
    throw new Error("L'identifiant de la liaison est requis pour la suppression.");
  }
  const recipeIngredientDoc = doc(db, 'recipeIngredients', recipeIngredientId);
  await deleteDoc(recipeIngredientDoc);
}

export async function updateRecipeDetails(recipeId: string, data: Partial<Recipe>) {
    if (!recipeId) {
        throw new Error("L'identifiant de la recette est requis.");
    }
    const recipeDoc = doc(db, 'recipes', recipeId);
    await setDoc(recipeDoc, data, { merge: true });
}

export async function updateRecipeIngredient(recipeIngredientId: string, data: { quantity: number; unitUse: string; }) {
    if (!recipeIngredientId) {
        throw new Error("L'identifiant de l'ingrédient de la recette est requis.");
    }
    const recipeIngredientDoc = doc(db, 'recipeIngredients', recipeIngredientId);
    await updateDoc(recipeIngredientDoc, data);
}
