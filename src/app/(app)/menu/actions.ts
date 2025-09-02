
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe, RecipePreparationLink, Preparation } from '@/lib/types';

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

    // NOTE: A "Plat" cannot be a child, so no need to look for child links.
  
    // 4. Commit the batch
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

export async function deleteRecipePreparationLink(linkId: string) {
    if (!linkId) {
      throw new Error("L'identifiant de la liaison est requis pour la suppression.");
    }
    const recipePreparationLinkDoc = doc(db, 'recipePreparationLinks', linkId);
    await deleteDoc(recipePreparationLinkDoc);
    // onSnapshot will handle UI updates
  }

export async function updateRecipeDetails(recipeId: string, data: Partial<Recipe | Preparation>, type: 'Plat' | 'Préparation') {
    if (!recipeId) {
        throw new Error("L'identifiant de la recette est requis.");
    }
    const collectionName = type === 'Plat' ? 'recipes' : 'preparations';
    const recipeDoc = doc(db, collectionName, recipeId);
    await updateDoc(recipeDoc, data);
}

export async function updateRecipeIngredient(recipeIngredientId: string, data: { quantity: number; unitUse: string; }) {
    if (!recipeIngredientId) {
        throw new Error("L'identifiant de l'ingrédient de la recette est requis.");
    }
    const recipeIngredientDoc = doc(db, 'recipeIngredients', recipeIngredientId);
    await updateDoc(recipeIngredientDoc, data);
}

export async function updateRecipePreparationLink(linkId: string, data: { quantity: number; unitUse: string; }) {
    if (!linkId) {
        throw new Error("L'identifiant de la liaison de préparation est requis.");
    }
    const linkDoc = doc(db, 'recipePreparationLinks', linkId);
    await updateDoc(linkDoc, data);
}

export async function addRecipePreparationLink(link: Omit<RecipePreparationLink, 'id'>) {
    await addDoc(collection(db, "recipePreparationLinks"), link);
}


    
