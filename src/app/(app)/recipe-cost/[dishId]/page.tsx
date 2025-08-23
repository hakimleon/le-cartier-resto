

"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { RecipeCostForm } from "../RecipeCostForm";
import { notFound } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe, Ingredient, RecipeIngredient } from "@/data/definitions";

export default function DynamicRecipeCostPage({ params }: { params: { dishId: string } }) {
  const { dishId } = params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!dishId) return;

      try {
        const recipeDoc = await getDoc(doc(db, "recipes", dishId));
        if (!recipeDoc.exists()) {
          notFound();
          return;
        }
        setRecipe({ id: recipeDoc.id, ...recipeDoc.data() } as Recipe);

        const recipesSnapshot = await getDocs(collection(db, "recipes"));
        setRecipes(recipesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));

        const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
        setIngredients(ingredientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ingredient)));
        
        const recipeIngredientsSnapshot = await getDocs(collection(db, "recipeIngredients"));
        setRecipeIngredients(recipeIngredientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecipeIngredient)));

      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dishId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader title="Chargement de la Fiche Technique..." />
        <main className="flex-1 p-4 lg:p-6">
          <p>Chargement...</p>
        </main>
      </div>
    );
  }

  if (!recipe) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title={`Fiche Technique: ${recipe.name}`} />
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm 
          recipe={recipe} 
          recipes={recipes} 
          ingredients={ingredients} 
          recipeIngredients={recipeIngredients} 
        />
      </main>
    </div>
  );
}
