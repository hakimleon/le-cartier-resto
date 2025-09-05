
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, where, getDocs, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe, RecipePreparationLink, Preparation, RecipeIngredientLink } from '@/lib/types';

export async function saveDish(recipe: Partial<Omit<Recipe, 'id'>> & { type: 'Plat', name: string }, id: string | null) {
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
  
    const batch = writeBatch(db);
  
    const recipeDoc = doc(db, 'recipes', id);
    batch.delete(recipeDoc);
  
    const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", id));
    const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
    recipeIngredientsSnap.forEach(doc => batch.delete(doc.ref));

    const recipePreparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", id));
    const recipePreparationsSnap = await getDocs(recipePreparationsQuery);
    recipePreparationsSnap.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
}


export async function replaceRecipeIngredients(recipeId: string, ingredients: Omit<RecipeIngredientLink, 'id' | 'recipeId'>[]) {
    const batch = writeBatch(db);

    const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", recipeId));
    const querySnapshot = await getDocs(ingredientsQuery);
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    ingredients.forEach((ingredient) => {
        if (ingredient.ingredientId && ingredient.quantity > 0) {
            const newLinkRef = doc(collection(db, "recipeIngredients"));
            batch.set(newLinkRef, { recipeId, ...ingredient });
        }
    });

    await batch.commit();
}

export async function replaceRecipePreparations(recipeId: string, preparations: Omit<RecipePreparationLink, 'id' | 'parentRecipeId'>[]) {
    const batch = writeBatch(db);

    const prepsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", recipeId));
    const querySnapshot = await getDocs(prepsQuery);
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    preparations.forEach((prep) => {
        if (prep.childPreparationId && prep.quantity > 0) {
            const newLinkRef = doc(collection(db, "recipePreparationLinks"));
            batch.set(newLinkRef, { parentRecipeId: recipeId, ...prep });
        }
    });

    await batch.commit();
}


export async function deleteRecipePreparationLink(linkId: string) {
    if (!linkId) {
      throw new Error("L'identifiant de la liaison est requis pour la suppression.");
    }
    const recipePreparationLinkDoc = doc(db, 'recipePreparationLinks', linkId);
    await deleteDoc(recipePreparationLinkDoc);
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

export async function addIngredientLink(link: Omit<RecipeIngredientLink, 'id'>) {
    await addDoc(collection(db, "recipeIngredients"), link);
}

export async function updateRecipePreparationLink(linkId: string, data: { quantity: number; }) {
    if (!linkId) {
        throw new Error("L'identifiant de la liaison de préparation est requis.");
    }
    const linkDoc = doc(db, 'recipePreparationLinks', linkId);
    await updateDoc(linkDoc, data);
}

export async function addRecipePreparationLink(link: Omit<RecipePreparationLink, 'id'>) {
    await addDoc(collection(db, "recipePreparationLinks"), link);
}

    