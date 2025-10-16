
'use server';

import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, where, getDocs, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe, RecipePreparationLink, Preparation, RecipeIngredientLink } from '@/lib/types';
import { v2 as cloudinary } from 'cloudinary';
import { analyzeTemporalContext } from '@/ai/flows/temporal-analysis-flow';


cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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

export async function updateDishStatus(id: string, status: 'Actif' | 'Inactif') {
  if (!id) {
    throw new Error("L'identifiant du plat est requis.");
  }
  const recipeDoc = doc(db, 'recipes', id);
  await updateDoc(recipeDoc, { status });
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

export async function updateRecipeDetails(recipeId: string, data: Partial<Recipe | Preparation>, collectionName: 'recipes' | 'preparations' | 'garnishes') {
    if (!recipeId) {
        throw new Error("L'identifiant de la recette est requis.");
    }
    const recipeDoc = doc(db, collectionName, recipeId);
    
    // Convert undefined to null for Firestore, but it's better to remove them
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

    await updateDoc(recipeDoc, cleanData);
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

export async function uploadImage(dataUri: string): Promise<string> {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("La configuration Cloudinary est incomplète côté serveur.");
  }
  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "la-compagnie-ai-generated",
      resource_type: "image",
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Le téléversement de l'image a échoué.");
  }
}


export async function analyzeAndSetMode(
    recipeId: string,
    name: string,
    procedure: string,
): Promise<'avance' | 'minute' | 'mixte'> {
    try {
        const resultMode = await analyzeTemporalContext({ name, procedure });
        
        // Déterminer la collection en fonction de la structure de l'ID ou d'autres logiques
        // Pour l'instant, on suppose qu'on ne met à jour que des 'recipes' ou 'preparations'
        // Cette logique peut avoir besoin d'être affinée
        let collectionName: 'recipes' | 'preparations' | 'garnishes' = 'recipes';
        
        const prepDoc = doc(db, 'preparations', recipeId);
        const prepSnap = await getDoc(prepDoc);
        if (prepSnap.exists()) {
            collectionName = 'preparations';
        } else {
            const garnishDoc = doc(db, 'garnishes', recipeId);
            const garnishSnap = await getDoc(garnishDoc);
            if (garnishSnap.exists()){
                collectionName = 'garnishes';
            }
        }

        await updateRecipeDetails(recipeId, { mode_preparation: resultMode }, collectionName);
        return resultMode;
    } catch (e) {
        console.error("Erreur lors de l'analyse et de la mise à jour du mode :", e);
        if (e instanceof Error) {
            throw new Error(`L'analyse par IA a échoué: ${e.message}`);
        }
        throw new Error("Une erreur inconnue est survenue lors de l'analyse.");
    }
}
