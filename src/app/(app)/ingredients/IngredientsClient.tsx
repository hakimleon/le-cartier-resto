
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Ingredient } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PlusCircle, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteIngredient } from "./actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IngredientModal } from "./IngredientModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function IngredientsClient() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante. Veuillez vérifier votre fichier .env.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const ingredientsCol = collection(db, "ingredients");
    const q = query(ingredientsCol, orderBy("name"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const ingredientsData = querySnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id } as Ingredient)
            );
            setIngredients(ingredientsData);
            setError(null);
        } catch(e: any) {
            console.error("Error processing ingredients snapshot: ", e);
            setError("Impossible de traiter les données des ingrédients. " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, (e: any) => {
        console.error("Error fetching ingredients with onSnapshot: ", e);
        setError("Impossible de charger les ingrédients en temps réel. " + e.message);
        setIsLoading(false);
    });

    return () => {
        if(unsubscribe) {
            unsubscribe();
        }
    };
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'ingrédient "${name}" ?`)) {
      deleteIngredient(id).catch(error => {
        console.error("Error deleting ingredient:", error);
        toast({
            title: "Erreur",
            description: "La suppression de l'ingrédient a échoué.",
            variant: "destructive",
        });
      });
    }
  };

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ingredient => 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingredients, searchTerm]);

  if (error && !isFirebaseConfigured) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de configuration Firebase</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
  }

  const renderSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({length: 7}).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Rechercher un ingrédient..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <IngredientModal ingredient={null} onSuccess={() => { /* onSnapshot handles updates */ }}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un ingrédient
          </Button>
        </IngredientModal>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des Ingrédients ({filteredIngredients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? renderSkeleton() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Stock actuel</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.length > 0 ? (
                    filteredIngredients.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ingredient.category}</Badge>
                        </TableCell>
                        <TableCell>{ingredient.unitPrice.toFixed(2)} DZD</TableCell>
                        <TableCell>{ingredient.unitPurchase}</TableCell>
                        <TableCell
                          className={cn(
                            ingredient.stockQuantity <= ingredient.lowStockThreshold
                              ? "text-red-600 font-bold"
                              : ""
                          )}
                        >
                          {ingredient.stockQuantity} {ingredient.unitPurchase}
                        </TableCell>
                        <TableCell>{ingredient.supplier}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IngredientModal ingredient={ingredient} onSuccess={() => { /* onSnapshot handles updates */ }}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </IngredientModal>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-500" onClick={() => handleDelete(ingredient.id!, ingredient.name)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Aucun ingrédient trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
