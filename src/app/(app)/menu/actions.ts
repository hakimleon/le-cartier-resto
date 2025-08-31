
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
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
  // No revalidation needed, onSnapshot handles updates on the client
}

export async function deleteDish(id: string) {
    if (!id) {
      throw new Error("L'identifiant est requis pour la suppression.");
    }
  
    const batch = writeBatch(db);
  
    // 1. Delete the recipe itself
    const recipeDoc = doc(db, 'recipes', id);
    batch.delete(recipeDoc);
  
    // 2. Find and delete all related ingredient links
    const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", id));
    const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
    recipeIngredientsSnap.forEach(doc => batch.delete(doc.ref));

    // 3. Find and delete all related preparation links (where this recipe is the PARENT)
    const recipePreparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", id));
    const recipePreparationsSnap = await getDocs(recipePreparationsQuery);
    recipePreparationsSnap.forEach(doc => batch.delete(doc.ref));

    // 4. Find and delete all links where this recipe is a CHILD
    const childRecipeLinksQuery = query(collection(db, "recipePreparationLinks"), where("childRecipeId", "==", id));
    const childRecipeLinksSnap = await getDocs(childRecipeLinksQuery);
    childRecipeLinksSnap.forEach(doc => batch.delete(doc.ref));
  
    // 5. Commit the batch
    await batch.commit();
    
    // onSnapshot will handle UI updates
}

export async function deleteRecipeIngredient(recipeIngredientId: string) {
  if (!recipeIngredientId) {
    throw new Error("L'identifiant de la liaison est requis pour la suppression.");
  }
  const recipeIngredientDoc = doc(db, 'recipeIngredients', recipeIngredientId);
  await deleteDoc(recipeIngredientDoc);
  // No revalidation needed, onSnapshot handles updates on the client
}

export async function deleteRecipePreparation(recipePreparationId: string) {
    if (!recipePreparationId) {
      throw new Error("L'identifiant de la liaison est requis pour la suppression.");
    }
    const recipePreparationDoc = doc(db, 'recipePreparationLinks', recipePreparationId);
    await deleteDoc(recipePreparationDoc);
    // onSnapshot will handle UI updates
  }

export async function updateRecipeDetails(recipeId: string, data: Partial<Recipe>) {
    if (!recipeId) {
        throw new Error("L'identifiant de la recette est requis.");
    }
    const recipeDoc = doc(db, 'recipes', recipeId);
    await updateDoc(recipeDoc, data);
}

export async function updateRecipeIngredient(recipeIngredientId: string, data: { quantity: number; unitUse: string; }) {
    if (!recipeIngredientId) {
        throw new Error("L'identifiant de l'ingrédient de la recette est requis.");
    }
    const recipeIngredientDoc = doc(db, 'recipeIngredients', recipeIngredientId);
    await updateDoc(recipeIngredientDoc, data);
}

    

    


    