
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Utensils } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DishForm } from "./DishForm";
import { seedRecipes, deleteDish } from "./actions";

const categories = ["Entrée", "Plat", "Dessert"];

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Recipe | null>(null);
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try fetching with ordering first
      const recipesCol = collection(db, "recipes");
      const q = query(recipesCol, orderBy("name"));
      const querySnapshot = await getDocs(q);
      const recipesData = querySnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
      );
      setRecipes(recipesData);
    } catch (error) {
      console.error("Error fetching sorted recipes, trying without sorting:", error);
      try {
        // Fallback to fetching without ordering
        const recipesCol = collection(db, "recipes");
        const querySnapshot = await getDocs(recipesCol);
        const recipesData = querySnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
        );
        setRecipes(recipesData);
         toast({
          title: "Avertissement",
          description:
            "Le tri des plats est désactivé. Pour l'activer, un index composé est nécessaire dans Firestore.",
          variant: "default",
        });
      } catch (fallbackError) {
         console.error("Error fetching recipes: ", fallbackError);
         toast({
           title: "Erreur",
           description: "Impossible de charger le menu. Veuillez réessayer.",
           variant: "destructive",
         });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedRecipes();
      await fetchRecipes(); // Refetch after seeding
      toast({
        title: "Succès",
        description: "Le menu de démonstration a été ajouté.",
      });
    } catch (error) {
      console.error("Error seeding recipes: ", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le menu de démonstration.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDish(id);
      await fetchRecipes(); // Refresh the list
      toast({
        title: "Plat supprimé",
        description: "Le plat a été supprimé avec succès.",
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

  const openEditDialog = (dish: Recipe) => {
    setSelectedDish(dish);
    setDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setSelectedDish(null);
    setDialogOpen(true);
  }

  const recipesByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = recipes.filter((r) => r.category === category);
      return acc;
    }, {} as Record<string, Recipe[]>);
  }, [recipes]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <Utensils className="h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Chargement du menu...</p>
        </div>
      );
    }

    if (recipes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-10 text-center">
          <Utensils className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Votre menu est vide</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Commencez par ajouter un plat ou utilisez nos exemples pour démarrer.
          </p>
          <Button onClick={handleSeed} disabled={isSeeding} className="mt-6">
            {isSeeding ? "Ajout en cours..." : "Ajouter un menu de démonstration"}
          </Button>
        </div>
      );
    }

    return (
      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recipesByCategory[category]?.map((dish) => (
                <Card key={dish.id}>
                  <CardHeader>
                    <CardTitle>{dish.name}</CardTitle>
                    <CardDescription>{dish.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{dish.price} €</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => openEditDialog(dish)}>Modifier</Button>
                    <Button variant="destructive" onClick={() => handleDelete(dish.id!)}>Supprimer</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mon Menu</h1>
          <Button onClick={openNewDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un plat
          </Button>
        </div>
        {renderContent()}
      </div>
       <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedDish ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
          </DialogHeader>
          <DishForm
            dish={selectedDish}
            onSuccess={() => {
              setDialogOpen(false);
              fetchRecipes();
            }}
          />
        </DialogContent>
    </Dialog>
  );
}
