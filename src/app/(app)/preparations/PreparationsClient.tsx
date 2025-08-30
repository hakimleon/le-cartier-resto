
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PlusCircle, Search } from "lucide-react";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeModal } from "./RecipeModal";
import { useToast } from "@/hooks/use-toast";
import { deleteDish } from "@/app/(app)/menu/actions";

export default function PreparationsClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const recipesCol = collection(db, "recipes");
    // We only want to show items of type 'Préparation'
    const q = query(recipesCol, where("type", "==", "Préparation"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const recipesData = querySnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
            );
            setRecipes(recipesData);
            setError(null);
        } catch(e: any) {
            console.error("Error processing preparations snapshot: ", e);
            setError("Impossible de traiter les données des préparations. " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, (e: any) => {
        console.error("Error fetching preparations with onSnapshot: ", e);
        setError("Impossible de charger les préparations en temps réel. " + e.message);
        setIsLoading(false);
    });

    return () => {
        if(unsubscribe) {
            unsubscribe();
        }
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
      try {
        await deleteDish(id);
        toast({
          title: "Succès",
          description: `La préparation "${name}" a été supprimée.`,
        });
      } catch (error) {
        console.error("Error deleting preparation:", error);
        toast({
          title: "Erreur",
          description: "La suppression de la préparation a échoué.",
          variant: "destructive",
        });
      }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  const renderRecipeList = (recipeList: Recipe[]) => {
    if (isLoading) {
       return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <div className="h-48 rounded-md bg-muted animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
      );
    }
    if (recipeList.length === 0) {
      return <div className="text-center text-muted-foreground pt-12">Aucune préparation ne correspond à votre recherche.</div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recipeList.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            onDelete={() => handleDelete(recipe.id!, recipe.name)}
          />
        ))}
      </div>
    );
  };

  if (error && !isFirebaseConfigured) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de configuration Firebase</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Gestion des Préparations</h1>
            <p className="text-muted-foreground">Gérez vos fiches techniques de préparations (sauces, fonds, etc.).</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher une préparation..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
             <RecipeModal recipe={null} type="Préparation" onSuccess={() => { /* onSnapshot handles updates */ }}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouvelle Préparation
                </Button>
            </RecipeModal>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="pt-4">
        {renderRecipeList(filteredRecipes)}
      </div>

    </div>
  );
}
