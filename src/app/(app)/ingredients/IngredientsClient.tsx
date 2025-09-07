
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

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteIngredient(id)
      toast({
        title: "Succès",
        description: `L'ingrédient "${name}" a été supprimé.`,
      });
      // onSnapshot will handle the UI update automatically
    }
    catch (error) {
      console.error("Error deleting ingredient:", error);
      toast({
          title: "Erreur",
          description: "La suppression de l'ingrédient a échoué.",
          variant: "destructive",
      });
    };
  };

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ingredient => 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.category.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Card className="shadow-none border">
            <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        {Array.from({length: 6}).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                            {Array.from({length: 6}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Rechercher par nom ou catégorie..." 
                className="pl-9 bg-card"
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
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

    {isLoading ? renderSkeleton() : (
      <Card className="shadow-none border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrédient</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Rendement</TableHead>
                    <TableHead className="text-right">Prix d'Achat</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.length > 0 ? (
                    filteredIngredients.map((ingredient) => {
                      const isLowStock = ingredient.stockQuantity <= ingredient.lowStockThreshold;
                      
                      return (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ingredient.category}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span>{ingredient.stockQuantity} {ingredient.purchaseUnit}</span>
                                {isLowStock && <Badge variant={'destructive'} className="mt-1 w-fit bg-orange-100 text-orange-800">Stock bas</Badge>}
                            </div>
                        </TableCell>
                        <TableCell>
                            {(ingredient.yieldPercentage || 0).toFixed(0)} %
                        </TableCell>
                        <TableCell className="text-right font-semibold">{(ingredient.purchasePrice || 0).toFixed(2)} DZD / {ingredient.purchaseUnit}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <IngredientModal ingredient={ingredient} onSuccess={() => { /* onSnapshot handles updates */ }}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </IngredientModal>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet ingrédient ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. L'ingrédient "{ingredient.name}" sera définitivement supprimé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(ingredient.id!, ingredient.name)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )})
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Aucun ingrédient trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
    )}
    </div>
  );
}
