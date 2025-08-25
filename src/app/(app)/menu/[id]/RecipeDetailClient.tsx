
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, RecipeIngredient, Ingredient } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChefHat, Euro, FilePen, FileText, Image as ImageIcon, Info, PlusCircle, Trash2, Utensils } from "lucide-react";
import Image from "next/image";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type RecipeDetailClientProps = {
  recipeId: string;
};

// Define a type for the new ingredient row to manage its state
type NewRecipeIngredient = Omit<RecipeIngredient, 'id'> & {
    id: string; // Temporary client-side ID
    ingredientId: string;
    category: string;
};

export default function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for inline editing
  const [newIngredients, setNewIngredients] = useState<NewRecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);


  const fetchRecipeData = async () => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // 1. Fetch the recipe document
      const recipeDocRef = doc(db, "recipes", recipeId);
      const recipeSnap = await getDoc(recipeDocRef);

      if (!recipeSnap.exists()) {
        setError("Fiche technique non trouvée.");
        return;
      }
      
      const fetchedRecipe = { ...recipeSnap.data(), id: recipeSnap.id } as Recipe;

      // 2. Fetch the related ingredients from 'recipeIngredients'
      const recipeIngredientsQuery = query(
        collection(db, "recipeIngredients"),
        where("recipeId", "==", recipeId)
      );
      const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
      
      const ingredientsDataPromises = recipeIngredientsSnap.docs.map(async (recipeIngredientDoc) => {
          const recipeIngredientData = recipeIngredientDoc.data();
          const ingredientDocRef = doc(db, "ingredients", recipeIngredientData.ingredientId);
          const ingredientSnap = await getDoc(ingredientDocRef);

          if (ingredientSnap.exists()) {
              const ingredientData = ingredientSnap.data() as Ingredient;
              const totalCost = (recipeIngredientData.quantity || 0) * (ingredientData.unitPrice || 0);
              
              return {
                  id: ingredientSnap.id,
                  name: ingredientData.name,
                  quantity: recipeIngredientData.quantity,
                  unit: recipeIngredientData.unitUse,
                  unitPrice: ingredientData.unitPrice,
                  totalCost: totalCost,
              };
          }
          return null;
      });

      const resolvedIngredients = (await Promise.all(ingredientsDataPromises)).filter(Boolean) as RecipeIngredient[];
      
      setIngredients(resolvedIngredients);
      
      setRecipe({
        ...fetchedRecipe,
        portions: fetchedRecipe.portions || 1,
        tvaRate: fetchedRecipe.tvaRate || 10,
        procedure_preparation: fetchedRecipe.procedure_preparation || "Procédure de préparation à ajouter.",
        procedure_cuisson: fetchedRecipe.procedure_cuisson || "Procédure de cuisson à ajouter.",
        procedure_service: fetchedRecipe.procedure_service || "Procédure de service à ajouter.",
        allergens: fetchedRecipe.allergens || [],
        commercialArgument: fetchedRecipe.commercialArgument || "Argumentaire à définir.",
      });

      // 3. Fetch all available ingredients for the dropdown
      const allIngredientsQuery = query(collection(db, "ingredients"), where("name", "!=", ""));
      const allIngredientsSnap = await getDocs(allIngredientsQuery);
      const allIngredientsData = allIngredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
      setAllIngredients(allIngredientsData);


    } catch (e: any) {
      console.error("Error fetching recipe data: ", e);
      setError("Impossible de charger les données de la fiche technique. " + e.message);
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    fetchRecipeData();
  }, [recipeId]);

  const handleAddNewIngredient = () => {
    setNewIngredients([
      ...newIngredients,
      {
        id: `new-${Date.now()}`, // Temporary unique ID
        ingredientId: '',
        name: '',
        quantity: 0,
        unit: 'g', // Default unit
        unitPrice: 0,
        totalCost: 0,
        category: '',
      },
    ]);
  };
  
  const handleNewIngredientChange = (tempId: string, field: keyof NewRecipeIngredient, value: any) => {
    setNewIngredients(current =>
      current.map(ing => {
        if (ing.id === tempId) {
          if (field === 'ingredientId') {
            const selectedIngredient = allIngredients.find(i => i.id === value);
            if (selectedIngredient) {
              const newQuantity = ing.quantity;
              const newTotalCost = newQuantity * selectedIngredient.unitPrice;
              return {
                ...ing,
                ingredientId: selectedIngredient.id!,
                name: selectedIngredient.name,
                unitPrice: selectedIngredient.unitPrice,
                category: selectedIngredient.category,
                totalCost: newTotalCost,
              };
            }
          } else if (field === 'quantity') {
            const newQuantity = Number(value);
            const newTotalCost = newQuantity * ing.unitPrice;
            return { ...ing, quantity: newQuantity, totalCost: newTotalCost };
          }
          return { ...ing, [field]: value };
        }
        return ing;
      })
    );
  };
  
  const handleRemoveNewIngredient = (tempId: string) => {
    setNewIngredients(current => current.filter(ing => ing.id !== tempId));
  };

  const handleSaveNewIngredients = async () => {
    // Logic to save to Firestore will be added here
    console.log("Saving:", newIngredients);
    alert("La sauvegarde des nouveaux ingrédients sera implémentée ici.");
    // After saving, refresh data and clear the new ingredients list
    // await fetchRecipeData();
    // setNewIngredients([]);
  };


  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recipe) {
    return null;
  }
  
  const totalIngredientsCost = ingredients.reduce((acc, item) => acc + item.totalCost, 0) || 0;
  const costPerPortion = totalIngredientsCost / (recipe.portions || 1);
  const priceHT = recipe.price / (1 + (recipe.tvaRate || 10) / 100);
  
  const grossMargin = priceHT > 0 ? priceHT - costPerPortion : 0;
  const grossMarginPercentage = priceHT > 0 ? (grossMargin / priceHT) * 100 : 0;
  const foodCostPercentage = priceHT > 0 ? (costPerPortion / priceHT) * 100 : 0;
  const multiplierCoefficient = costPerPortion > 0 ? priceHT / costPerPortion : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary rounded-full h-14 w-14 flex items-center justify-center">
                <ChefHat className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
                <p className="text-muted-foreground">{recipe.category}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <FilePen className="mr-2 h-4 w-4"/>
                Modifier
            </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left & Center Column */}
        <div className="lg:col-span-2 space-y-8">
            {/* General & Costs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Informations & Rentabilité</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-lg">
                           <div>
                                <p className="text-sm text-muted-foreground">Vente TTC</p>
                                <p className="font-bold text-lg">{recipe.price.toFixed(2)}€</p>
                           </div>
                           <div>
                                <p className="text-sm text-muted-foreground">Vente HT</p>
                                <p className="font-bold text-lg">{priceHT.toFixed(2)}€</p>
                           </div>
                           <div>
                                <p className="text-sm text-muted-foreground">Portions</p>
                                <p className="font-bold text-lg">{recipe.portions}</p>
                           </div>
                       </div>
                        <div className="space-y-2 text-sm border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Coût Matière / Portion</span>
                                <span className="font-semibold">{costPerPortion.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Coefficient</span>
                                 <span className="font-semibold">x {multiplierCoefficient.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Marge Brute</span>
                                <span className="font-semibold">{grossMargin.toFixed(2)}€ ({grossMarginPercentage.toFixed(2)}%)</span>
                            </div>
                        </div>
                   </div>
                   <div className="flex flex-col items-center justify-center">
                       <h4 className="font-semibold text-center mb-2">Food Cost (%)</h4>
                        <GaugeChart 
                            value={foodCostPercentage}
                            label={`Coût portion: ${costPerPortion.toFixed(2)}€`}
                            unit="%"
                        />
                   </div>
                </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Utensils className="h-5 w-5"/>Ingrédients</div>
                         <Button variant="outline" size="sm" onClick={handleAddNewIngredient}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter</Button>
                    </CardTitle>
                    <CardDescription>Liste des ingrédients nécessaires pour {recipe.portions} portions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Ingrédient</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Unité</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-right">Coût total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ingredients.length > 0 && ingredients.map(ing => (
                                <TableRow key={ing.id}>
                                    <TableCell className="font-medium">{ing.name}</TableCell>
                                    <TableCell>{ing.quantity}</TableCell>
                                    <TableCell>{ing.unit}</TableCell>
                                     <TableCell>
                                        <Badge variant="secondary">{allIngredients.find(i => i.id === ing.id)?.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{ing.totalCost.toFixed(2)}€</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                             {newIngredients.map((newIng) => (
                                <TableRow key={newIng.id}>
                                    <TableCell>
                                        <Select
                                            onValueChange={(value) => handleNewIngredientChange(newIng.id, 'ingredientId', value)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                                            <SelectContent>
                                                {allIngredients.map(ing => (
                                                    <SelectItem key={ing.id} value={ing.id!}>{ing.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="Qté"
                                            className="w-20"
                                            onChange={(e) => handleNewIngredientChange(newIng.id, 'quantity', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <Select
                                            defaultValue={newIng.unit}
                                            onValueChange={(value) => handleNewIngredientChange(newIng.id, 'unit', value)}
                                        >
                                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="g">g</SelectItem>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="ml">ml</SelectItem>
                                                <SelectItem value="l">l</SelectItem>
                                                <SelectItem value="pièce">pièce</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{newIng.category || 'N/A'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {newIng.totalCost.toFixed(2)}€
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveNewIngredient(newIng.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                             ))}

                             {ingredients.length === 0 && newIngredients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Aucun ingrédient lié à cette recette.</TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4 gap-4">
                       {newIngredients.length > 0 && (
                           <Button onClick={handleSaveNewIngredients}>Sauvegarder les Ingrédients</Button>
                       )}
                        <div className="text-right">
                            <p className="text-muted-foreground">Coût total ingrédients</p>
                            <p className="text-xl font-bold">{totalIngredientsCost.toFixed(2)}€</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {/* Procedure */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Procédure</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="preparation">
                        <TabsList>
                            <TabsTrigger value="preparation">Préparation</TabsTrigger>
                            <TabsTrigger value="cuisson">Cuisson</TabsTrigger>
                            <TabsTrigger value="service">Service</TabsTrigger>
                        </TabsList>
                        <TabsContent value="preparation" className="prose prose-sm max-w-none pt-4 whitespace-pre-wrap">
                            {recipe.procedure_preparation}
                        </TabsContent>
                        <TabsContent value="cuisson" className="prose prose-sm max-w-none pt-4 whitespace-pre-wrap">
                             {recipe.procedure_cuisson}
                        </TabsContent>
                        <TabsContent value="service" className="prose prose-sm max-w-none pt-4 whitespace-pre-wrap">
                             {recipe.procedure_service}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
            {/* Allergens */}
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600"/>Allergènes</div>
                         <Button variant="ghost" size="icon" className="h-8 w-8"><FilePen className="h-4 w-4"/></Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {recipe.allergens?.map(allergen => <Badge key={allergen} variant="secondary">{allergen}</Badge>)}
                </CardContent>
            </Card>
            {/* Commercial Argument */}
             <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5"/>Argumentaire Commercial</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                   <p>{recipe.commercialArgument}</p>
                </CardContent>
            </Card>

             {/* Photo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/>Photo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video relative w-full rounded-lg overflow-hidden border">
                         <Image src={recipe.imageUrl || "https://placehold.co/800x600.png"} alt={recipe.name} fill objectFit="cover" data-ai-hint="food image" />
                    </div>
                    <Button variant="outline" className="w-full mt-4">Changer la photo</Button>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

function RecipeDetailSkeleton() {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </header>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* General Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                   <div className="space-y-3 pt-4 border-t">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                </div>
              </CardContent>
            </Card>
  
            {/* Ingredients Card Skeleton */}
            <Card>
              <CardHeader>
                 <Skeleton className="h-6 w-32" />
                 <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
  
          {/* Right Column Skeleton */}
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
             <Card>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
             <Card>
              <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

    