

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
    ingredients: Omit<RecipeIngredient, 'id'>[];
}

export async function saveRecipeSheet(data: SaveRecipeSheetData) {
  try {
    const batch = writeBatch(db);

    // 1. Update the recipe document with the new cost and procedure
    const recipeRef = doc(db, "recipes", data.recipeId);
    batch.update(recipeRef, { 
        // Firestore security rules might prevent writing top-level fields
        // that are not in the initial object. We will update `cost` in a sub-collection
        // or a dedicated field if the data model allows. For now, we update procedure.
        // We also add the cost to the recipe document itself for easier access.
        cost: data.cost,
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
        // Ensure we have an ingredient selected and quantity is valid
        if (ingredient.ingredientId && ingredient.quantity > 0) { 
            // Always create a new document ID for the recipe ingredient entry
            const newIngredientRef = doc(recipeIngredientsCollection);
            batch.set(newIngredientRef, {
                recipeId: data.recipeId,
                ingredientId: ingredient.ingredientId,
                quantity: ingredient.quantity,
                unitUse: ingredient.unitUse,
            });
        }
    });

    await batch.commit();
    
    // Revalidate paths to reflect changes
    revalidatePath("/menu");
    revalidatePath(`/recipe-cost/${data.recipeId}`);
    revalidatePath("/menu-performance"); // Performance data depends on cost

    return { success: true, message: `Fiche technique pour la recette ${data.recipeId} sauvegardée.` };
  } catch (error) {
    console.error("Error saving recipe sheet:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de la sauvegarde : ${errorMessage}` };
  }
}
