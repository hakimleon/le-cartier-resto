'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';

/**
 * Saves a garnish (creates or updates).
 */
export async function saveGarnish(garnish: Partial<Omit<Preparation, 'id'>>, id: string | null): Promise<Preparation> {
  const dataToSave = {
    name: garnish.name || 'Nouvelle Garniture',
    description: garnish.description || '',
    category: garnish.category || 'Accompagnements', 
    type: 'Préparation' as const, // Stored as a 'Préparation' type for structural compatibility
    difficulty: 'Moyen',
    duration: 0,
    productionQuantity: 1,
    productionUnit: 'portion',
    usageUnit: 'portion',
  };

  let savedGarnish: Preparation;

  if (id) {
    const garnishDoc = doc(db, 'garnishes', id);
    await setDoc(garnishDoc, dataToSave, { merge: true });
    savedGarnish = { id, ...dataToSave } as Preparation;
  } else {
    const docRef = await addDoc(collection(db, 'garnishes'), dataToSave);
    savedGarnish = { id: docRef.id, ...dataToSave } as Preparation;
  }
  return savedGarnish;
}

/**
 * Deletes a garnish and all associated links.
 */
export async function deleteGarnish(id: string) {
  if (!id) {
    throw new Error("L'identifiant est requis pour la suppression.");
  }

  const batch = writeBatch(db);

  // 1. Delete the garnish itself from the 'garnishes' collection
  const garnishDoc = doc(db, 'garnishes', id);
  batch.delete(garnishDoc);

  // 2. Find and delete ingredient links for this garnish
  const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", id));
  const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
  recipeIngredientsSnap.forEach(doc => batch.delete(doc.ref));

  // 3. Find and delete links where this garnish is used as a CHILD in other recipes/preparations
  const childRecipeLinksQuery = query(collection(db, "recipePreparationLinks"), where("childPreparationId", "==", id));
  const childRecipeLinksSnap = await getDocs(childRecipeLinksQuery);
  childRecipeLinksSnap.forEach(doc => batch.delete(doc.ref));
  
  // 4. Find and delete links where this garnish is the PARENT (contains sub-recipes)
  const parentRecipeLinksQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", id));
  const parentRecipeLinksSnap = await getDocs(parentRecipeLinksQuery);
  parentRecipeLinksSnap.forEach(doc => batch.delete(doc.ref));

  await batch.commit();
}
