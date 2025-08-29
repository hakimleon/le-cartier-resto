
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PlusCircle, Search } from "lucide-react";
import { RecipeCard } from "@/components/RecipeCard";
import { DishModal } from "./DishModal";
import { useToast } from "@/hooks/use-toast";
import { deleteDish } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formatCategory = (category: string) => {
    const separator = category.includes("–") ? "–" : "-";
    if (category.includes(separator)) {
        return category.split(separator)[0].trim();
    }
    return category.trim();
};

const sortCategories = (categories: string[]) => {
  const customOrder = [
    "Entrées froides et chaudes",
    "Plats",
    "Les mets de chez nous",
    "Symphonie de pâtes",
    "Humburgers",
    "Dessert",
  ];

  return [...categories].sort((a, b) => {
    const indexA = customOrder.indexOf(a);
    const indexB = customOrder.indexOf(b);
    
    // If both are not in customOrder, sort them alphabetically
    if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b); 
    }
    // If only a is not in customOrder, move it to the end
    if (indexA === -1) return 1;
    // If only b is not in customOrder, move it to the end
    if (indexB === -1) return -1;
    
    // Otherwise, sort based on the customOrder index
    return indexA - indexB;
  });
};

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante. Veuillez vérifier votre fichier .env.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const recipesData = querySnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
            );
            setRecipes(recipesData);

            const uniqueCategories = [...new Set(recipesData.map(recipe => recipe.category))];
            const sortedCategories = sortCategories(uniqueCategories);

            setCategories(["Tous", ...sortedCategories]);
            setError(null);
        } catch(e: any) {
            console.error("Error processing recipes snapshot: ", e);
            setError("Impossible de traiter les données du menu. " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, (e: any) => {
        console.error("Error fetching recipes with onSnapshot: ", e);
        setError("Impossible de charger le menu en temps réel. " + e.message);
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
          description: `Le plat "${name}" a été supprimé.`,
        });
        // onSnapshot will handle the UI update automatically
      } catch (error) {
        console.error("Error deleting dish:", error);
        toast({
          title: "Erreur",
          description: "La suppression du plat a échoué.",
          variant: "destructive",
        });
      }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesCategory = selectedCategory === 'Tous' || recipe.category === selectedCategory;
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [recipes, searchTerm, selectedCategory]);


  const renderRecipeList = (recipeList: Recipe[]) => {
    if (isLoading) {
       return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
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
      return <div className="text-center text-muted-foreground pt-12">Aucun plat ne correspond à votre recherche.</div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Gestion du Menu</h1>
            <p className="text-muted-foreground">Gérez les plats de votre restaurant.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher un plat..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <DishModal dish={null} onSuccess={() => { /* onSnapshot handles updates */ }}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouveau Plat
                </Button>
            </DishModal>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="h-auto flex-wrap justify-start">
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
              >
               
                {formatCategory(category)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={selectedCategory} className="pt-4">
              {renderRecipeList(filteredRecipes)}
          </TabsContent>
      </Tabs>

    </div>
  );
}

    