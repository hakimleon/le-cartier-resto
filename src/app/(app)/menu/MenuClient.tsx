
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Utensils, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setFirebaseError(true);
      setIsLoading(false);
      return;
    }

    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const recipesCol = collection(db, "recipes");
        const querySnapshot = await getDocs(recipesCol);
        const recipesData = querySnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
        );
        setRecipes(recipesData);
      } catch (error) {
         console.error("Error fetching recipes: ", error);
         toast({
           title: "Erreur de chargement",
           description: "Impossible de charger le menu. Vérifiez les règles de sécurité Firestore et la console pour plus de détails.",
           variant: "destructive",
         });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [toast]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <Utensils className="h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Chargement du menu...</p>
        </div>
      );
    }
    
    if (firebaseError) {
      return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de Configuration Firebase</AlertTitle>
          <AlertDescription>
            La connexion à Firebase a échoué. Veuillez vérifier que les variables d'environnement Firebase (NEXT_PUBLIC_FIREBASE_*) sont correctement définies dans votre fichier `.env`. Sans cette configuration, l'application ne peut pas accéder à la base de données.
          </AlertDescription>
        </Alert>
      );
    }

    if (recipes.length === 0) {
      return (
        <div className="text-center p-10">
          <h3 className="text-lg font-semibold">Le menu ne contient aucune recette.</h3>
          <p className="text-muted-foreground">Ajoutez votre premier plat pour commencer.</p>
        </div>
      );
    }

    return (
      <ul>
        {recipes.map((dish) => (
          <li key={dish.id} className="border-b py-2">
            <span className="font-bold">{dish.name}</span> - {dish.price} €
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mon Menu (Liste Simple)</h1>
      </div>
      {renderContent()}
    </div>
  );
}
