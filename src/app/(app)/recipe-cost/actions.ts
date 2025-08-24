
"use server";

import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, query, where } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { RecipeIngredient } from "@/data/definitions";

type Procedure = {
    preparation: string[];
    cuisson: string[];
    service: string[];
}

type SaveRecipeSheetData = {
    recipeId: string;
    cost: number;
    procedure: Procedure;
    ingredients: RecipeIngredient[];
}

export async function saveRecipeSheet(data: SaveRecipeSheetData) {
  try {
    const batch = writeBatch(db);

    // 1. Update the recipe document with the new cost and procedure
    const recipeRef = doc(db, "recipes", data.recipeId);
    batch.update(recipeRef, { 
        // cost: data.cost,  // Cost is not in the model, let's not add it for now.
        procedure: data.procedure 
    });

    // 2. Clear existing ingredients for this recipe
    const recipeIngredientsCollection = collection(db, "recipeIngredients");
    const q = query(recipeIngredientsCollection, where("recipeId", "==", data.recipeId));
    const existingIngredientsSnapshot = await getDocs(q);
    
    existingIngredientsSnapshot.forEach(document => {
        batch.delete(document.ref);
    });

    // 3. Add the new ingredients
    data.ingredients.forEach((ingredient) => {
        if (ingredient.ingredientId) { // Ensure we have an ingredient selected
            const docId = ingredient.id.startsWith('new-') ? doc(recipeIngredientsCollection).id : ingredient.id;
            const newIngredientRef = doc(recipeIngredientsCollection, docId);
            batch.set(newIngredientRef, {
                recipeId: data.recipeId,
                ingredientId: ingredient.ingredientId,
                quantity: ingredient.quantity,
                unitUse: ingredient.unitUse,
            });
        }
    });

    await batch.commit();
    
    revalidatePath("/menu");
    revalidatePath(`/recipe-cost/${data.recipeId}`);

    return { success: true, message: `Fiche technique pour la recette ${data.recipeId} sauvegardée.` };
  } catch (error) {
    console.error("Error saving recipe sheet:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de la sauvegarde : ${errorMessage}` };
  }
}

    