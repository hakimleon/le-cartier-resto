
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';

/**
 * Sauvegarde une préparation (crée ou met à jour).
 */
export async function savePreparation(preparation: Partial<Omit<Preparation, 'id'>>, id: string | null): Promise<Preparation> {
  const dataToSave = {
    name: preparation.name || 'Nouvelle Préparation',
    description: preparation.description || '',
    type: 'Préparation' as const,
    difficulty: 'Moyen',
    duration: 0,
    productionQuantity: 1,
    productionUnit: 'Unité',
    usageUnit: 'g',
  };

  let savedPreparation: Preparation;

  if (id) {
    // Mettre à jour un document existant
    const preparationDoc = doc(db, 'preparations', id);
    await setDoc(preparationDoc, dataToSave, { merge: true });
    savedPreparation = { id, ...dataToSave } as Preparation;
  } else {
    // Créer un nouveau document
    const docRef = await addDoc(collection(db, 'preparations'), dataToSave);
    savedPreparation = { id: docRef.id, ...dataToSave } as Preparation;
  }
  return savedPreparation;
}

/**
 * Supprime une préparation et tous les liens associés.
 */
export async function deletePreparation(id: string) {
  if (!id) {
    throw new Error("L'identifiant est requis pour la suppression.");
  }

  const batch = writeBatch(db);

  // 1. Supprimer la préparation elle-même
  const preparationDoc = doc(db, 'preparations', id);
  batch.delete(preparationDoc);

  // 2. Trouver et supprimer les liens d'ingrédients pour cette préparation
  const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", id));
  const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
  recipeIngredientsSnap.forEach(doc => batch.delete(doc.ref));

  // 3. Trouver et supprimer les liens où cette préparation est utilisée comme ENFANT
  const childRecipeLinksQuery = query(collection(db, "recipePreparationLinks"), where("childPreparationId", "==", id));
  const childRecipeLinksSnap = await getDocs(childRecipeLinksQuery);
  childRecipeLinksSnap.forEach(doc => batch.delete(doc.ref));
  
  // 4. Trouver et supprimer les liens où cette préparation est le PARENT
  const parentRecipeLinksQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", id));
  const parentRecipeLinksSnap = await getDocs(parentRecipeLinksQuery);
  parentRecipeLinksSnap.forEach(doc => batch.delete(doc.ref));


  // 5. Exécuter le batch
  await batch.commit();
}
