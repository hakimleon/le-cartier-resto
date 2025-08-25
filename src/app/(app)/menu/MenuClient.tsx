"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
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
import { PlusCircle, Utensils, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DishForm } from "./DishForm";
import { seedRecipes, deleteDish } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const categories = ["Entrée", "Plat", "Dessert"];

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Recipe | null>(null);
  const { toast } = useToast();
  const [firebaseError, setFirebaseError] = useState(false);

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

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedRecipes();
      const recipesCol = collection(db, "recipes");
      const querySnapshot = await getDocs(recipesCol);
      const recipesData = querySnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
      );
      setRecipes(recipesData);
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
    if (!id) return;
    try {
      await deleteDish(id);
      setRecipes(recipes.filter(r => r.id !== id));
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
  
  const handleSuccess = async () => {
    setDialogOpen(false);
    const recipesCol = collection(db, "recipes");
    const querySnapshot = await getDocs(recipesCol);
    const recipesData = querySnapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
    );
    setRecipes(recipesData);
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
          <Button onClick={openNewDialog} disabled={firebaseError}>
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
            onSuccess={handleSuccess}
          />
        </DialogContent>
    </Dialog>
  );
}
