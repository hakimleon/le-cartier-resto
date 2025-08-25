
"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { deleteDish, seedRecipes } from "./actions";
import { DishForm } from "./DishForm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, AlertTriangle, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Recipe | null>(null);

  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante. Veuillez vérifier votre fichier .env.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const recipesCol = collection(db, "recipes");
      const q = query(recipesCol, orderBy("name"));
      const querySnapshot = await getDocs(q);
      const recipesData = querySnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as Recipe)
      );
      setRecipes(recipesData);
      setError(null);
    } catch (e: any) {
      console.error("Error fetching recipes: ", e);
      setError("Impossible de charger le menu. Vérifiez les règles de sécurité Firestore ou si un index est manquant.");
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le menu. Vérifiez la console pour les détails.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSeed = async () => {
    try {
      await seedRecipes();
      await fetchRecipes();
      toast({
        title: "Succès",
        description: "Les recettes de démo ont été ajoutées.",
      });
    } catch (error) {
      console.error("Error seeding recipes:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les recettes de démo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDish(id);
      await fetchRecipes();
      toast({
        title: "Succès",
        description: "Le plat a été supprimé.",
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

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchRecipes();
  };

  const openEditForm = (dish: Recipe) => {
    setSelectedDish(dish);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setSelectedDish(null);
    setIsFormOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <Utensils className="h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Chargement du menu...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de Configuration Firebase</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      );
    }

    if (recipes.length === 0) {
      return (
        <div className="text-center p-10 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Votre menu est vide</h3>
          <p className="text-muted-foreground mt-2 mb-4">Commencez par ajouter votre premier plat ou utilisez nos recettes de démo.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={openNewForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un plat
            </Button>
            <Button variant="secondary" onClick={handleSeed}>
              Ajouter les démos
            </Button>
          </div>
        </div>
      );
    }

    const categories: ('Entrée' | 'Plat' | 'Dessert')[] = ["Entrée", "Plat", "Dessert"];
    const categorizedRecipes = {
        Entrée: recipes.filter(r => r.category === 'Entrée'),
        Plat: recipes.filter(r => r.category === 'Plat'),
        Dessert: recipes.filter(r => r.category === 'Dessert'),
    }

    return (
        <Tabs defaultValue="Entrée">
            <TabsList className="mb-4">
                {categories.map(category => (
                    <TabsTrigger key={category} value={category}>{category} ({categorizedRecipes[category].length})</TabsTrigger>
                ))}
            </TabsList>
            {categories.map(category => (
                <TabsContent key={category} value={category}>
                    {categorizedRecipes[category].length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Aucun plat dans cette catégorie.</p>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categorizedRecipes[category].map(dish => (
                            <Card key={dish.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        {dish.name}
                                        <Badge variant="secondary">{dish.price.toFixed(2)} €</Badge>
                                    </CardTitle>
                                    <CardDescription>{dish.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="rounded-md" />}
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => openEditForm(dish)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible et supprimera définitivement le plat "{dish.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(dish.id!)}>Supprimer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    )}
                </TabsContent>
            ))}
        </Tabs>
    )
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mon Menu</h1>
        {recipes.length > 0 && (
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un plat
          </Button>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedDish ? "Modifier le plat" : "Ajouter un nouveau plat"}</DialogTitle>
            </DialogHeader>
            <DishForm dish={selectedDish} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
      
      {renderContent()}
    </div>
  );
}

    