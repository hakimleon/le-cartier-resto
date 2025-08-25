'use server';

import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/lib/types';

const mockRecipes: Omit<Recipe, 'id'>[] = [
  { name: 'Soupe à l’oignon', description: 'Une soupe à l’oignon classique avec du fromage gratiné.', price: 12, category: 'Entrées froides et chaudes' },
  { name: 'Salade Niçoise', description: 'Thon, pommes de terre, haricots verts, tomates et olives.', price: 15, category: 'Entrées froides et chaudes' },
  { name: 'Boeuf Bourguignon', description: 'Un ragoût de bœuf riche et savoureux cuit au vin rouge.', price: 28, category: 'Plats' },
  { name: 'Coq au Vin', description: 'Poulet braisé au vin avec des lardons, des champignons et de l’ail.', price: 26, category: 'Plats' },
  { name: 'Ratatouille', description: 'Un plat de légumes provençal traditionnel.', price: 22, category: 'Les mets de chez nous' },
  { name: 'Pâtes Carbonara', description: 'Pâtes avec une sauce crémeuse, des lardons et du fromage.', price: 18, category: 'Symphonie de pâtes' },
  { name: 'Burger Classique', description: 'Un burger juteux avec fromage, laitue, et tomate.', price: 16, category: 'Humburgers' },
  { name: 'Crème Brûlée', description: 'Une crème riche avec une couche de caramel dur.', price: 9, category: 'Dessert' },
  { name: 'Mousse au Chocolat', description: 'Une mousse au chocolat légère et aérée.', price: 8, category: 'Dessert' },
];

export async function seedRecipes() {
  const recipesCol = collection(db, 'recipes');
  for (const recipe of mockRecipes) {
    await addDoc(recipesCol, recipe);
  }
}

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
