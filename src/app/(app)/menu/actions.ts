
"use server";

import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { mockRecipes, mockRecipeIngredients } from "@/data/mock-data";
import { Recipe } from "@/data/definitions";

// Function to get the full recipes with a calculated cost
async function getFullRecipesWithCost(): Promise<Recipe[]> {
    const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
    const ingredients = ingredientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const fullRecipes = mockRecipes.map(recipe => {
        const relatedIngredients = mockRecipeIngredients.filter(ri => ri.recipeId === recipe.id);
        const cost = relatedIngredients.reduce((acc, ri) => {
            const ingredient = ingredients.find(ing => ing.id === ri.ingredientId);
            if (!ingredient) return acc;
            // Simplified cost calculation, assumes unitUse is 'g' and unitPurchase is 'kg' for cost calculation
            // In a real app, this would be more robust with unit conversions
            const costPerGram = ingredient.unitPrice / 1000;
            return acc + (costPerGram * ri.quantity);
        }, 0);
        return {
            ...recipe,
            cost: cost, // Calculated cost
            argumentationCommerciale: recipe.name // Placeholder
        };
    });

    return fullRecipes;
}


export async function seedRecipes() {
  try {
    const batch = writeBatch(db);

    const recipesCollection = collection(db, "recipes");
    mockRecipes.forEach((recipe) => {
      // Create a new object excluding cost and argumentationCommerciale before setting
      const { ...recipeToStore } = recipe;
      const docRef = doc(recipesCollection, recipe.id);
      batch.set(docRef, recipeToStore);
    });

    const recipeIngredientsCollection = collection(db, "recipeIngredients");
    mockRecipeIngredients.forEach((ri) => {
      const docRef = doc(recipeIngredientsCollection, ri.id);
      batch.set(docRef, ri);
    });

    await batch.commit();
    
    revalidatePath("/menu");
    revalidatePath("/recipe-cost");

    return { success: true, message: `${mockRecipes.length} recettes ont été ajoutées.` };
  } catch (error) {
    console.error("Error seeding recipes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de l'initialisation : ${errorMessage}` };
  }
}
