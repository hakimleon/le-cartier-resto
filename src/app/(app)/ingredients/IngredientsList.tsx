
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ingredient } from "@/data/definitions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Edit, Package, Plus, Search, Database, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IngredientForm } from "./IngredientForm";
import { seedIngredients } from "./actions";
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
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace("DZD", "").trim() + " DZD";
};

type IngredientsListProps = {
    initialIngredients: Ingredient[];
}

export function IngredientsList({ initialIngredients }: IngredientsListProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ingredientToEdit, setIngredientToEdit] = useState<Ingredient | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);

  const fetchIngredients = async () => {
    const ingredientsCol = collection(db, "ingredients");
    const q = query(ingredientsCol, orderBy("name"));
    const ingredientsSnapshot = await getDocs(q);
    const ingredientsList = ingredientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Ingredient));
    setIngredients(ingredientsList);
  };

  const filteredIngredients = ingredients.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddNew = () => {
    setIngredientToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setIngredientToEdit(ingredient);
    setIsDialogOpen(true);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const result = await seedIngredients();
      if (result.success) {
        toast({
          title: "Base de données initialisée !",
          description: result.message,
        });
        // Re-fetch ingredients from firestore
        await fetchIngredients();
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        });
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur inattendue est survenue.",
        });
    } finally {
        setIsSeeding(false);
    }
  };

  const handleSaveIngredient = (ingredientData: Ingredient) => {
    // Here you would typically save to Firestore and then update the local state.
    // For now, we'll just update the local state.
    if (ingredientToEdit) {
      setIngredients(ingredients.map(item => item.id === ingredientData.id ? ingredientData : item));
      toast({ title: "Ingrédient mis à jour !", description: `L'ingrédient "${ingredientData.name}" a été modifié.` });
    } else {
      const newIngredient = { ...ingredientData, id: `ing-${Date.now()}` };
      setIngredients([...ingredients, newIngredient]);
      toast({ title: "Ingrédient ajouté !", description: `L'ingrédient "${ingredientData.name}" a été ajouté.` });
    }
    setIsDialogOpen(false);
    setIngredientToEdit(null);
  };

  return (
    <>
        <div className="flex justify-between items-center mb-6">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher par nom, catégorie, fournisseur..." 
                    className="pl-9 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline" disabled={isSeeding}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {isSeeding ? "Réinitialisation..." : "Réinitialiser les données"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action va effacer toutes les données actuelles (ingrédients, recettes, etc.) et les remplacer par les données de démonstration. Cette opération est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSeedDatabase} disabled={isSeeding}>
                        Confirmer la réinitialisation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un ingrédient
                </Button>
            </div>
        </div>
        
        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle>Liste des Ingrédients ({filteredIngredients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Unité Achat</TableHead>
                  <TableHead>Stock actuel</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.length > 0 ? (
                  filteredIngredients.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="whitespace-nowrap">{item.category}</Badge>
                        </TableCell>
                         <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{item.unitPurchase}</TableCell>
                        <TableCell>
                            <span className={cn(
                                "font-medium",
                                item.stockQuantity === 0 ? "text-destructive" : item.stockQuantity < item.lowStockThreshold ? "text-orange-500" : "text-green-600"
                            )}>
                                {item.stockQuantity} {item.unitPurchase}
                            </span>
                        </TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-48 text-muted-foreground">
                            <div className="flex flex-col items-center gap-4">
                                <Package className="w-16 h-16 text-muted-foreground/50" />
                                <p className="font-semibold">Votre inventaire est vide.</p>
                                <p>Cliquez sur le bouton ci-dessous pour initialiser votre base de données avec des données de démonstration.</p>
                                <Button onClick={handleSeedDatabase} disabled={isSeeding}>
                                    <Database className="mr-2 h-4 w-4" />
                                    {isSeeding ? "Initialisation en cours..." : "Initialiser la base de données"}
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{ingredientToEdit ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}</DialogTitle>
                <DialogDescription>
                {ingredientToEdit ? "Modifiez les informations de cet ingrédient." : "Remplissez les informations pour le nouvel ingrédient."}
                </DialogDescription>
            </DialogHeader>
            <IngredientForm 
                ingredient={ingredientToEdit}
                onSave={handleSaveIngredient}
                onCancel={() => setIsDialogOpen(false)}
            />
            </DialogContent>
        </Dialog>
    </>
  );
}
