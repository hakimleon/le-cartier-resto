
"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Preparation, Ingredient, RecipeIngredientLink, RecipePreparationLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type SubRecipeRow = {
    id: string; // temp id
    preparationId: string;
    name: string;
    quantity: number;
    unit: string;
    totalCost: number;
};

const getConversionFactor = (purchaseUnit: string, usageUnit: string): number => {
    if (!purchaseUnit || !usageUnit) return 1;
  
    const pUnit = purchaseUnit.toLowerCase().trim();
    const uUnit = usageUnit.toLowerCase().trim();
  
    if (pUnit === uUnit) return 1;
  
    const conversions: Record<string, Record<string, number>> = {
      'kg': { 'g': 1000, 'kg': 1 },
      'l': { 'ml': 1000, 'l': 1 },
      'litre': { 'ml': 1000, 'l': 1 },
      'pièce': { 'pièce': 1 }
    };
  
    if (conversions[pUnit] && conversions[pUnit][uUnit]) {
      return conversions[pUnit][uUnit];
    }
  
    for (const baseUnit in conversions) {
      for (const targetUnit in conversions[baseUnit]) {
        if (baseUnit === uUnit && targetUnit === pUnit) {
          return 1 / conversions[baseUnit][targetUnit];
        }
      }
    }
    return 1;
  };

export default function SubRecipeTestClient() {
  const [allPreparations, setAllPreparations] = useState<Preparation[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [preparationCosts, setPreparationCosts] = useState<Record<string, number>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubRecipes, setSelectedSubRecipes] = useState<SubRecipeRow[]>([]);
  const [currentSelection, setCurrentSelection] = useState({ prepId: '', quantity: 1, unit: 'g' });
  
  const calculatePreparationCost = useCallback(async (
    preparation: Preparation,
    allIngredients: Ingredient[],
    allPreparations: Preparation[],
    allRecipeIngredients: RecipeIngredientLink[],
    allRecipePreparationLinks: RecipePreparationLink[],
    memo: Record<string, number>
  ): Promise<number> => {
      if (memo[preparation.id!]) {
          return memo[preparation.id!];
      }
  
      let totalCost = 0;
  
      // 1. Calculate cost from direct ingredients
      const directIngredientLinks = allRecipeIngredients.filter(link => link.recipeId === preparation.id);
      for (const link of directIngredientLinks) {
          const ingredient = allIngredients.find(i => i.id === link.ingredientId);
          if (ingredient && ingredient.unitPrice) {
              const factor = getConversionFactor(ingredient.unitPurchase, link.unitUse);
              const costPerUseUnit = ingredient.unitPrice / factor;
              totalCost += (link.quantity || 0) * costPerUseUnit;
          }
      }
  
      // 2. Calculate cost from sub-preparations (recursive step)
      const subPreparationLinks = allRecipePreparationLinks.filter(link => link.parentRecipeId === preparation.id);
      for (const link of subPreparationLinks) {
          const subPreparation = allPreparations.find(p => p.id === link.childPreparationId);
          if (subPreparation) {
              const subPrepCostPerUnit = await calculatePreparationCost(
                  subPreparation, allIngredients, allPreparations, allRecipeIngredients, allRecipePreparationLinks, memo
              );
              totalCost += (link.quantity || 0) * subPrepCostPerUnit;
          }
      }
      
      const costPerUnit = (totalCost / (preparation.productionQuantity || 1)) || 0;
      memo[preparation.id!] = costPerUnit; // Memoize the result
      return costPerUnit;
  }, []);

  const calculateAllCosts = useCallback(async (
      ingredients: Ingredient[],
      preparations: Preparation[],
      recipeIngredients: RecipeIngredientLink[],
      recipePreparationLinks: RecipePreparationLink[]
  ) => {
      const costs: Record<string, number> = {};
      const memo: Record<string, number> = {};
      for (const prep of preparations) {
          if (!prep.id) continue;
          costs[prep.id] = await calculatePreparationCost(prep, ingredients, preparations, recipeIngredients, recipePreparationLinks, memo);
      }
      return costs;
  }, [calculatePreparationCost]);
  

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("Configuration Firebase manquante.");
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const ingredientsSnap = await getDocs(query(collection(db, "ingredients")));
            const ingredientsList = ingredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
            setAllIngredients(ingredientsList);

            const prepsSnap = await getDocs(query(collection(db, "preparations")));
            const prepsList = prepsSnap.docs.map(doc => ({...doc.data(), id: doc.id} as Preparation));
            setAllPreparations(prepsList);

            const recipeIngredientsSnap = await getDocs(query(collection(db, "recipeIngredients")));
            const recipeIngredientsList = recipeIngredientsSnap.docs.map(doc => doc.data() as RecipeIngredientLink);

            const recipePreparationLinksSnap = await getDocs(query(collection(db, "recipePreparationLinks")));
            const recipePreparationLinksList = recipePreparationLinksSnap.docs.map(doc => doc.data() as RecipePreparationLink);
            
            const costs = await calculateAllCosts(ingredientsList, prepsList, recipeIngredientsList, recipePreparationLinksList);
            setPreparationCosts(costs);

            setError(null);
        } catch(e: any) {
            console.error("Error fetching data for test client: ", e);
            setError("Erreur de chargement des données. " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    fetchAllData();
  }, [calculateAllCosts]);


  const handleAddSubRecipe = () => {
    if (!currentSelection.prepId) return;
    
    const preparation = allPreparations.find(p => p.id === currentSelection.prepId);
    if (!preparation) return;

    const costPerUnit = preparationCosts[preparation.id!] || 0;
    const totalCost = costPerUnit * currentSelection.quantity;

    const newRow: SubRecipeRow = {
        id: `row-${Date.now()}`,
        preparationId: preparation.id!,
        name: preparation.name,
        quantity: currentSelection.quantity,
        unit: currentSelection.unit,
        totalCost: totalCost,
    };

    setSelectedSubRecipes([...selectedSubRecipes, newRow]);
  };

  const handleRemoveSubRecipe = (id: string) => {
    setSelectedSubRecipes(selectedSubRecipes.filter(row => row.id !== id));
  };


  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-40 w-full" />
        </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 p-4 border rounded-lg">
        <div className="flex-1">
          <label className="text-sm font-medium">Sous-Recette</label>
          <Select 
            value={currentSelection.prepId} 
            onValueChange={val => setCurrentSelection(s => ({ ...s, prepId: val }))}
          >
            <SelectTrigger><SelectValue placeholder="Choisir une préparation..." /></SelectTrigger>
            <SelectContent>
              {allPreparations.map(p => (
                <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Quantité</label>
          <Input 
            type="number" 
            value={currentSelection.quantity} 
            onChange={e => setCurrentSelection(s => ({ ...s, quantity: parseFloat(e.target.value) || 0 }))}
            className="w-24"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Unité</label>
          <Input 
            value={currentSelection.unit}
            onChange={e => setCurrentSelection(s => ({ ...s, unit: e.target.value }))}
            className="w-24"
          />
        </div>
        <Button onClick={handleAddSubRecipe}>
          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de Test</CardTitle>
          <CardDescription>Les sous-recettes ajoutées apparaissent ici avec leur coût calculé.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Coût Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSubRecipes.length > 0 ? selectedSubRecipes.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell className="text-right font-semibold">{row.totalCost.toFixed(2)}€</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSubRecipe(row.id)}>
                        <Trash2 className="h-4 w-4 text-red-500"/>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Ajoutez une sous-recette pour la tester.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
