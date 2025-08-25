"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipes() {
      if (!isFirebaseConfigured) {
        setError("La configuration de Firebase est manquante. Veuillez vérifier votre fichier .env.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const recipesCol = collection(db, "recipes");
        const querySnapshot = await getDocs(recipesCol);
        const recipesData = querySnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
        );
        setRecipes(recipesData);
        setError(null);
      } catch (e: any) {
        console.error("Error fetching recipes: ", e);
        setError("Impossible de charger le menu.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipes();
  }, []);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      );
  }

  if (recipes.length === 0) {
    return <div>Le menu est vide.</div>;
  }

  return (
    <div>
      <h1>Menu</h1>
      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            {recipe.name} - {recipe.price} €
          </li>
        ))}
      </ul>
    </div>
  );
}
