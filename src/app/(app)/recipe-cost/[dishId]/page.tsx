

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!dishId || dishId === 'new') {
        setRecipe(null); // This is a new recipe sheet
      } else {
        try {
          const recipeDoc = await getDoc(doc(db, "recipes", dishId));
          if (!recipeDoc.exists()) {
            setError("Recette non trouvée.");
            return;
          }
          setRecipe({ id: recipeDoc.id, ...recipeDoc.data() } as Recipe);
        } catch (err) {
          console.error("Error fetching recipe:", err);
          setError("Erreur lors du chargement de la recette.");
        }
      }

      // Fetch common data for both new and existing sheets
      try {
        const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
        setIngredients(ingredientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ingredient)));
        
        if (dishId && dishId !== 'new') {
            const recipeIngredientsSnapshot = await getDocs(collection(db, "recipeIngredients"));
            setRecipeIngredients(recipeIngredientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecipeIngredient)));
        }
      } catch (err) {
          console.error("Error fetching ingredients:", err);
          setError("Erreur lors du chargement des ingrédients.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dishId]);
  
  const pageTitle = recipe ? `Fiche pour ${recipe.name}` : "Nouvelle Fiche Technique";

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10">
          <p className="text-destructive">{error}</p>
          <Button asChild variant="link">
            <Link href="/recipe-cost">Retourner à la liste</Link>
          </Button>
        </div>
      );
    }
    
    // For a new form, recipe is null, but we pass other necessary data
    return (
      <RecipeCostForm 
        recipe={recipe} 
        ingredients={ingredients} 
        recipeIngredients={recipeIngredients} 
      />
    );
  };


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 lg:px-6 border-b">
         <Button variant="outline" asChild>
            <Link href="/recipe-cost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste
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
        {renderContent()}
      </main>
    </div>
  );
}

