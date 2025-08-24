
"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe, Ingredient, RecipeIngredient } from "@/data/definitions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { RecipeCostForm } from "../RecipeCostForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function DynamicRecipeCostPage({ params }: { params: { dishId: string } }) {
  const { dishId } = params;
  const router = useRouter();
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
        setLoading(false);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dishId]);

  const pageTitle = recipe ? `Fiche pour ${recipe.name}` : "Fiche Technique";

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 lg:px-6 border-b">
         <Button variant="outline" asChild>
            <Link href="/menu">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au menu
            </Link>
         </Button>
         <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold font-headline">Fiche Technique d'Envoi</h1>
            </div>
            <p className="text-muted-foreground">{loading ? 'Chargement...' : pageTitle}</p>
         </div>
         {/* Placeholder to balance the flex layout */}
         <div className="w-[160px]"></div> 
      </header>
      <main className="flex-1 p-4 lg:p-6">
        {loading ? (
             <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : !recipe ? (
            <div className="text-center py-10">
                <p>Recette non trouvée.</p>
                <Button asChild variant="link">
                    <Link href="/menu">Retourner au menu</Link>
                </Button>
            </div>
        ) : (
            <RecipeCostForm 
              recipe={recipe} 
              recipes={recipes} 
              ingredients={ingredients} 
              recipeIngredients={recipeIngredients} 
            />
        )}
      </main>
    </div>
  );
}
