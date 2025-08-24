
"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { RecipeCostForm } from "./RecipeCostForm";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe, Ingredient, RecipeIngredient } from "@/data/definitions";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeCostPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const recipesSnapshot = await getDocs(collection(db, "recipes"));
        setRecipes(recipesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));

        const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
        setIngredients(ingredientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ingredient)));
        
        const recipeIngredientsSnapshot = await getDocs(collection(db, "recipeIngredients"));
        setRecipeIngredients(recipeIngredientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecipeIngredient)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-center p-4 lg:px-6 border-b">
         <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold font-headline">Nouvelle Fiche Technique</h1>
            </div>
            <p className="text-muted-foreground">Créez une nouvelle fiche de coût pour un plat</p>
         </div>
      </header>
      <main className="flex-1 p-4 lg:p-6">
        {loading ? (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : (
            <RecipeCostForm 
                recipe={null} 
                recipes={recipes} 
                ingredients={ingredients} 
                recipeIngredients={recipeIngredients} 
            />
        )}
      </main>
    </div>
  );
}
