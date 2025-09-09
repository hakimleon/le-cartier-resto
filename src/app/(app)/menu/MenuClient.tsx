
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
import { DishModal } from "./DishModal";
import { useToast } from "@/hooks/use-toast";
import { deleteDish } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/alert-dialog";

const formatCategory = (category?: string) => {
    if (!category) return "";
    return category.split(/[-–]/)[0].trim();
};

const sortCategories = (categories: string[]) => {
  const customOrder = [
    "Entrées froides et chaudes",
    "Plats et Grillades",
    "Les mets de chez nous",
    "Symphonie de pâtes",
    "Nos Burgers Bistronomiques",
    "Dessert",
    "Élixirs & Rafraîchissements",
  ];

  return [...categories].sort((a, b) => {
    const normalizedA = a.toLowerCase().trim();
    const normalizedB = b.toLowerCase().trim();
    
    const indexA = customOrder.findIndex(item => item.toLowerCase().trim() === normalizedA);
    const indexB = customOrder.findIndex(item => item.toLowerCase().trim() === normalizedB);

    if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b);
    }

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
};

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [inactiveCategories, setInactiveCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState<'Actif' | 'Inactif'>('Actif');
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante. Veuillez vérifier votre fichier .env.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol, where("type", "==", "Plat"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const recipesData = querySnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
            );
            
            setRecipes(recipesData);
            
            const activeCategoryMap = new Map<string, string>();
            const inactiveCategoryMap = new Map<string, string>();

            recipesData.forEach(recipe => {
                if (recipe.category) {
                    const normalizedCategory = recipe.category.toLowerCase().trim();
                    if(recipe.status === 'Actif') {
                        if (!activeCategoryMap.has(normalizedCategory)) {
                            activeCategoryMap.set(normalizedCategory, recipe.category);
                        }
                    } else {
                         if (!inactiveCategoryMap.has(normalizedCategory)) {
                            inactiveCategoryMap.set(normalizedCategory, recipe.category);
                        }
                    }
                }
            });
            
            const uniqueActiveCategories = Array.from(activeCategoryMap.values());
            const uniqueInactiveCategories = Array.from(inactiveCategoryMap.values());
            
            setActiveCategories(["Tous", ...sortCategories(uniqueActiveCategories)]);
            setInactiveCategories(["Tous", ...sortCategories(uniqueInactiveCategories)]);
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
  
   useEffect(() => {
    setSelectedCategory("Tous");
  }, [selectedStatus]);

  const handleDelete = async (id: string, name: string) => {
      try {
        await deleteDish(id);
        toast({
          title: "Succès",
          description: `Le plat "${name}" a été supprimé.`,
        });
      } catch (error) {
        console.error("Error deleting dish:", error);
        toast({
          title: "Erreur",
          description: "La suppression du plat a échoué.",
          variant: "destructive",
        });
      }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
      setSelectedCategory("Tous");
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
        const statusMatch = recipe.status === selectedStatus;
        const searchTermMatch = searchTerm === '' || recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'Tous' || recipe.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
        return statusMatch && searchTermMatch && categoryMatch;
    });
  }, [recipes, searchTerm, selectedCategory, selectedStatus]);


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
      return <div className="text-center text-muted-foreground pt-12">Aucun plat ne correspond à vos critères.</div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recipeList.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            allCategories={selectedStatus === 'Actif' ? activeCategories.filter(c => c !== "Tous") : inactiveCategories.filter(c => c !== "Tous")}
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
                    onChange={handleSearchChange}
                />
            </div>
             <DishModal dish={null} allCategories={activeCategories.filter(c => c !== "Tous")} onSuccess={() => { /* onSnapshot handles updates */ }}>
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

        <Tabs defaultValue="Actif" onValueChange={(value) => setSelectedStatus(value as 'Actif' | 'Inactif')}>
            <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="Actif">Plats Actifs</TabsTrigger>
                <TabsTrigger value="Inactif">Plats Inactifs</TabsTrigger>
            </TabsList>
            <TabsContent value="Actif">
                 <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="pt-4">
                    <TabsList>
                        {activeCategories.map((category) => (
                        <TabsTrigger key={category} value={category}>{formatCategory(category)}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value={selectedCategory} className="pt-4">
                        {renderRecipeList(filteredRecipes)}
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="Inactif">
                 <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="pt-4">
                    <TabsList>
                        {inactiveCategories.map((category) => (
                        <TabsTrigger key={category} value={category}>{formatCategory(category)}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value={selectedCategory} className="pt-4">
                        {renderRecipeList(filteredRecipes)}
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
    </div>
  );
}

    