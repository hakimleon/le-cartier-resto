
"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, RecipeIngredient, Ingredient, RecipeIngredientLink } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChefHat, Clock, Euro, FilePen, FileText, Image as ImageIcon, Info, PlusCircle, Save, Soup, Trash2, Utensils, X } from "lucide-react";
import Image from "next/image";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { deleteRecipeIngredient, updateRecipeDetails, updateRecipeIngredient } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RecipeDetailClientProps = {
  recipeId: string;
};

// Extends RecipeIngredient to include purchase unit details for conversion
type FullRecipeIngredient = RecipeIngredient & {
    unitPurchase: string; 
    recipeIngredientId: string; // The ID of the document in recipeIngredients collection
};

type NewRecipeIngredient = {
    id: string; // Temporary client-side ID
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    unitPurchase: string; // From the selected ingredient
    totalCost: number;
};

const getConversionFactor = (purchaseUnit: string, usageUnit: string) => {
    if (!purchaseUnit || !usageUnit) return 1;
    const pUnit = purchaseUnit.toLowerCase();
    const uUnit = usageUnit.toLowerCase();
    if (pUnit === uUnit) return 1;
    if (pUnit === 'kg' && uUnit === 'g') return 1000;
    if (pUnit === 'l' && uUnit === 'ml') return 1000;
    return 1; // Default to 1 if no conversion rule found
}

export default function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [editableRecipe, setEditableRecipe] = useState<Recipe | null>(null);
  
  const [ingredients, setIngredients] = useState<FullRecipeIngredient[]>([]);
  const [editableIngredients, setEditableIngredients] = useState<FullRecipeIngredient[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  
  const [newIngredients, setNewIngredients] = useState<NewRecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const unsubscribeCallbacks: (() => void)[] = [];

    // 1. Fetch all available ingredients for the dropdown (one-time fetch is fine here)
    const fetchAllIngredients = async () => {
        try {
            const allIngredientsQuery = query(collection(db, "ingredients"), where("name", "!=", ""));
            const allIngredientsSnap = await getDocs(allIngredientsQuery);
            const allIngredientsData = allIngredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
            setAllIngredients(allIngredientsData);
        } catch (e: any) {
            console.error("Error fetching all ingredients: ", e);
            setError("Impossible de charger la liste complète des ingrédients. " + e.message);
        }
    };
    fetchAllIngredients();

    // 2. Set up real-time listener for the recipe document
    const recipeDocRef = doc(db, "recipes", recipeId);
    const unsubscribeRecipe = onSnapshot(recipeDocRef, (recipeSnap) => {
        if (!recipeSnap.exists()) {
            setError("Fiche technique non trouvée.");
            setRecipe(null);
            setIsLoading(false);
            return;
        }
        
        const fetchedRecipe = { ...recipeSnap.data(), id: recipeSnap.id } as Recipe;
        const fullRecipe = {
          ...fetchedRecipe,
          portions: fetchedRecipe.portions || 1,
          tvaRate: fetchedRecipe.tvaRate || 10,
          procedure_preparation: fetchedRecipe.procedure_preparation || "Procédure de préparation à ajouter.",
          procedure_cuisson: fetchedRecipe.procedure_cuisson || "Procédure de cuisson à ajouter.",
          procedure_service: fetchedRecipe.procedure_service || "Procédure de service à ajouter.",
          allergens: fetchedRecipe.allergens || [],
          commercialArgument: fetchedRecipe.commercialArgument || "Argumentaire à définir.",
          duration: fetchedRecipe.duration || 25,
          difficulty: fetchedRecipe.difficulty || "Moyen",
          status: fetchedRecipe.status || "Actif",
        };
        setRecipe(fullRecipe);
        if (!isEditing) {
            setEditableRecipe(fullRecipe);
        }
        setError(null);
    }, (e: any) => {
        console.error("Error with recipe snapshot: ", e);
        setError("Erreur de chargement de la fiche technique. " + e.message);
        setIsLoading(false);
    });
    unsubscribeCallbacks.push(unsubscribeRecipe);

    // 3. Set up real-time listener for related ingredients
    const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", recipeId));
    const unsubscribeRecipeIngredients = onSnapshot(recipeIngredientsQuery, async (recipeIngredientsSnap) => {
        try {
            const ingredientsDataPromises = recipeIngredientsSnap.docs.map(async (recipeIngredientDoc) => {
                const recipeIngredientData = recipeIngredientDoc.data() as RecipeIngredientLink;
                const ingredientDocRef = doc(db, "ingredients", recipeIngredientData.ingredientId);
                const ingredientSnap = await getDoc(ingredientDocRef); // can be one-time fetch since ingredient details change less often

                if (ingredientSnap.exists()) {
                    const ingredientData = ingredientSnap.data() as Ingredient;
                    const conversionFactor = getConversionFactor(ingredientData.unitPurchase, recipeIngredientData.unitUse);
                    const costPerUseUnit = ingredientData.unitPrice / conversionFactor;
                    const totalCost = (recipeIngredientData.quantity || 0) * costPerUseUnit;
                    
                    return {
                        id: ingredientSnap.id,
                        recipeIngredientId: recipeIngredientDoc.id,
                        name: ingredientData.name,
                        quantity: recipeIngredientData.quantity,
                        unit: recipeIngredientData.unitUse,
                        unitPrice: ingredientData.unitPrice,
                        unitPurchase: ingredientData.unitPurchase,
                        totalCost: totalCost,
                    };
                }
                return null;
            });

            const resolvedIngredients = (await Promise.all(ingredientsDataPromises)).filter(Boolean) as FullRecipeIngredient[];
            setIngredients(resolvedIngredients);
            if (!isEditing) {
                setEditableIngredients(resolvedIngredients);
            }
        } catch (e: any) {
            console.error("Error processing recipe ingredients snapshot:", e);
            setError("Erreur de chargement des ingrédients de la recette. " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, (e: any) => {
        console.error("Error with recipe ingredients snapshot: ", e);
        setError("Erreur de chargement des ingrédients de la recette. " + e.message);
        setIsLoading(false);
    });
    unsubscribeCallbacks.push(unsubscribeRecipeIngredients);

    // Cleanup function to unsubscribe from all listeners on component unmount
    return () => {
      unsubscribeCallbacks.forEach(unsub => unsub());
    };
  }, [recipeId, isEditing]); // Re-sync non-editable state when editing is cancelled

  const handleToggleEditMode = () => {
    if (isEditing) {
        // Cancel editing
        if(recipe) setEditableRecipe(recipe);
        if(ingredients) setEditableIngredients(ingredients);
        setNewIngredients([]);
    }
    setIsEditing(!isEditing);
  };

  const handleRecipeDataChange = (field: keyof Recipe, value: any) => {
    if (editableRecipe) {
        setEditableRecipe({ ...editableRecipe, [field]: value });
    }
  };
  
  const recomputeIngredientCost = (ingredient: FullRecipeIngredient | NewRecipeIngredient) => {
    const conversionFactor = getConversionFactor(ingredient.unitPurchase, ingredient.unit);
    const costPerUseUnit = ingredient.unitPrice / conversionFactor;
    return (ingredient.quantity || 0) * costPerUseUnit;
  };

  const handleIngredientChange = (recipeIngredientId: string, field: 'quantity' | 'unit', value: any) => {
    setEditableIngredients(current => 
        current.map(ing => {
            if (ing.recipeIngredientId === recipeIngredientId) {
                const updatedIng = { ...ing, [field]: value };
                updatedIng.totalCost = recomputeIngredientCost(updatedIng);
                return updatedIng;
            }
            return ing;
        })
    );
  };

  const handleAddNewIngredient = () => {
    setNewIngredients([
      ...newIngredients,
      {
        id: `new-${Date.now()}`,
        ingredientId: '',
        name: '',
        quantity: 0,
        unit: 'g',
        unitPrice: 0,
        unitPurchase: '',
        totalCost: 0,
      },
    ]);
  };
  
  const handleNewIngredientChange = (tempId: string, field: keyof NewRecipeIngredient, value: any) => {
    setNewIngredients(current =>
      current.map(ing => {
        if (ing.id === tempId) {
          const updatedIng = { ...ing, [field]: value };
          
          if (field === 'ingredientId') {
            const selectedIngredient = allIngredients.find(i => i.id === value);
            if (selectedIngredient) {
                updatedIng.name = selectedIngredient.name;
                updatedIng.unitPrice = selectedIngredient.unitPrice;
                updatedIng.unitPurchase = selectedIngredient.unitPurchase;
            }
          }
          
          updatedIng.totalCost = recomputeIngredientCost(updatedIng);

          return updatedIng;
        }
        return ing;
      })
    );
  };
  
  const handleRemoveNewIngredient = (tempId: string) => {
    setNewIngredients(current => current.filter(ing => ing.id !== tempId));
  };
  
  const handleRemoveExistingIngredient = async (recipeIngredientId: string, ingredientName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer "${ingredientName}" de cette recette ?`)) {
        return;
    }
    try {
        await deleteRecipeIngredient(recipeIngredientId);
        // The 'onSnapshot' listener will automatically update the UI.
        // We can also optimistically update the state for a faster feel.
        setEditableIngredients(current => current.filter(ing => ing.recipeIngredientId !== recipeIngredientId));
        toast({
            title: "Succès",
            description: `L'ingrédient "${ingredientName}" a été retiré de la recette.`,
        });
    } catch (error) {
        console.error("Error deleting recipe ingredient:", error);
        toast({
            title: "Erreur",
            description: "La suppression de l'ingrédient a échoué. Veuillez rafraîchir.",
            variant: "destructive",
        });
    }
  };


  const handleSave = async () => {
    if (!editableRecipe) return;

    setIsSaving(true);
    try {
        await updateRecipeDetails(recipeId, {
            portions: editableRecipe.portions,
            tvaRate: editableRecipe.tvaRate,
            price: editableRecipe.price,
            procedure_preparation: editableRecipe.procedure_preparation,
            procedure_cuisson: editableRecipe.procedure_cuisson,
            procedure_service: editableRecipe.procedure_service,
            commercialArgument: editableRecipe.commercialArgument,
        });

        const ingredientUpdatePromises = editableIngredients.map(ing => {
            return updateRecipeIngredient(ing.recipeIngredientId, {
                quantity: ing.quantity,
                unitUse: ing.unit,
            });
        });

        const newIngredientPromises = newIngredients.map(ing => {
            if (!ing.ingredientId || ing.quantity <= 0) return null;
            return addDoc(collection(db, "recipeIngredients"), {
                recipeId: recipeId,
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
                unitUse: ing.unit,
                unitPurchase: ing.unitPurchase // Store purchase unit for future conversions
            });
        });

        await Promise.all([...ingredientUpdatePromises, ...newIngredientPromises.filter(Boolean)]);

        toast({
            title: "Succès",
            description: "Les modifications ont été sauvegardées.",
        });

        setIsEditing(false);
        setNewIngredients([]); // Clear new ingredients form on save
        // No need to fetch, onSnapshot will sync the data

    } catch (error) {
        console.error("Error saving changes:", error);
        toast({
            title: "Erreur",
            description: "La sauvegarde des modifications a échoué.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const currentRecipeData = isEditing ? editableRecipe : recipe;
  const currentIngredientsData = isEditing ? editableIngredients : ingredients;
  
  const combinedIngredients = useMemo(() => {
    const existing = currentIngredientsData.map(ing => ({
        ...ing,
        totalCost: ing.totalCost || 0
    }));
    const newOnes = newIngredients.map(ing => ({
        ...ing,
        totalCost: ing.totalCost || 0
    }));
    return [...existing, ...newOnes];
  }, [currentIngredientsData, newIngredients]);

  const {
    totalIngredientsCost,
    costPerPortion,
    priceHT,
    grossMargin,
    grossMarginPercentage,
    foodCostPercentage,
    multiplierCoefficient
  } = useMemo(() => {
    if (!currentRecipeData) return {
        totalIngredientsCost: 0,
        costPerPortion: 0,
        priceHT: 0,
        grossMargin: 0,
        grossMarginPercentage: 0,
        foodCostPercentage: 0,
        multiplierCoefficient: 0
    };

    const totalCost = combinedIngredients.reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const portions = currentRecipeData.portions || 1;
    const costPerPortionValue = portions > 0 ? totalCost / portions : 0;
    const tvaRate = currentRecipeData.tvaRate || 10;
    const priceHTValue = currentRecipeData.price / (1 + tvaRate / 100);
    
    const grossMarginValue = priceHTValue > 0 ? priceHTValue - costPerPortionValue : 0;
    const grossMarginPercentageValue = priceHTValue > 0 ? (grossMarginValue / priceHTValue) * 100 : 0;
    const foodCostPercentageValue = priceHTValue > 0 ? (costPerPortionValue / priceHTValue) * 100 : 0;
    const multiplierCoefficientValue = costPerPortionValue > 0 ? priceHTValue / costPerPortionValue : 0;

    return {
        totalIngredientsCost: totalCost,
        costPerPortion: costPerPortionValue,
        priceHT: priceHTValue,
        grossMargin: grossMarginValue,
        grossMarginPercentage: grossMarginPercentageValue,
        foodCostPercentage: foodCostPercentageValue,
        multiplierCoefficient: multiplierCoefficientValue
    };
  }, [currentRecipeData, combinedIngredients]);


  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="max-w-2xl mx-auto my-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!recipe || !currentRecipeData) {
    return (
        <div className="container mx-auto py-10 text-center">
            <p>Chargement de la recette...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary rounded-lg h-14 w-14 flex items-center justify-center shrink-0">
                <ChefHat className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
                <p className="text-muted-foreground">{recipe.category}</p>
                 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <Badge variant={recipe.status === 'Actif' ? 'default' : 'secondary'} className={cn(recipe.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>{recipe.status}</Badge>
                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {recipe.duration} min</div>
                    <div className="flex items-center gap-1.5"><Soup className="h-4 w-4" /> {recipe.difficulty}</div>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handleToggleEditMode}>
                 {isEditing ? <><X className="mr-2 h-4 w-4"/>Annuler</> : <><FilePen className="mr-2 h-4 w-4"/>Modifier</>}
            </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 (Left): Ingredients */}
        <div className="space-y-8">
             <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Utensils className="h-5 w-5"/>Ingrédients</div>
                         {isEditing && <Button variant="outline" size="sm" onClick={handleAddNewIngredient}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter</Button>}
                    </CardTitle>
                    <CardDescription>Liste des ingrédients nécessaires pour {currentRecipeData.portions} portions.</CardDescription>
                </CardHeader>
                <CardContent>
                    
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Ingrédient</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Unité</TableHead>
                                <TableHead className="text-right">Coût total</TableHead>
                                {isEditing && <TableHead className="w-[50px]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentIngredientsData.map(ing => (
                                <TableRow key={ing.recipeIngredientId}>
                                    <TableCell className="font-medium">{ing.name}</TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          value={ing.quantity}
                                          onChange={(e) => handleIngredientChange(ing.recipeIngredientId, 'quantity', parseFloat(e.target.value) || 0)}
                                          className="w-20"
                                        />
                                      ) : (
                                        ing.quantity
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Select
                                            value={ing.unit}
                                            onValueChange={(value) => handleIngredientChange(ing.recipeIngredientId, 'unit', value)}
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
                                      ) : (
                                        ing.unit
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{ing.totalCost.toFixed(2)}€</TableCell>
                                    {isEditing && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveExistingIngredient(ing.recipeIngredientId, ing.name)}>
                                                <Trash2 className="h-4 w-4 text-red-500"/>
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                             {isEditing && newIngredients.map((newIng) => (
                                <TableRow key={newIng.id}>
                                    <TableCell>
                                        <Select
                                            value={newIng.ingredientId}
                                            onValueChange={(value) => handleNewIngredientChange(newIng.id, 'ingredientId', value)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                                            <SelectContent>
                                                {allIngredients.map(ing => (
                                                    ing.id ? <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem> : null
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="Qté"
                                            className="w-20"
                                            value={newIng.quantity === 0 ? '' : newIng.quantity}
                                            onChange={(e) => handleNewIngredientChange(newIng.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <Select
                                            value={newIng.unit}
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

                             {combinedIngredients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={isEditing ? 5: 4} className="text-center h-24">Aucun ingrédient lié à cette recette.</TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4 gap-4">
                        <div className="text-right">
                            <p className="text-muted-foreground">Coût total ingrédients</p>
                            <p className="text-xl font-bold">{totalIngredientsCost.toFixed(2)}€</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Column 2 (Center): Photo & Procedure */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/>Photo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video relative w-full rounded-lg overflow-hidden border">
                         <Image src={recipe.imageUrl || "https://placehold.co/800x600.png"} alt={recipe.name} fill style={{objectFit: "cover"}} data-ai-hint="food image" />
                    </div>
                    {isEditing && <Button variant="outline" className="w-full mt-4">Changer la photo</Button>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Procédure</CardTitle>
                </CardHeader>
                <CardContent>
                   {isEditing ? (
                        <Tabs defaultValue="preparation">
                            <TabsList>
                                <TabsTrigger value="preparation">Préparation</TabsTrigger>
                                <TabsTrigger value="cuisson">Cuisson</TabsTrigger>
                                <TabsTrigger value="service">Service</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preparation" className="pt-4">
                                <Textarea 
                                    value={editableRecipe?.procedure_preparation}
                                    onChange={(e) => handleRecipeDataChange('procedure_preparation', e.target.value)}
                                    rows={8}
                                />
                            </TabsContent>
                            <TabsContent value="cuisson" className="pt-4">
                               <Textarea 
                                    value={editableRecipe?.procedure_cuisson}
                                    onChange={(e) => handleRecipeDataChange('procedure_cuisson', e.target.value)}
                                    rows={8}
                                />
                            </TabsContent>
                            <TabsContent value="service" className="pt-4">
                                 <Textarea 
                                    value={editableRecipe?.procedure_service}
                                    onChange={(e) => handleRecipeDataChange('procedure_service', e.target.value)}
                                    rows={8}
                                />
                            </TabsContent>
                        </Tabs>
                   ) : (
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
                   )}
                </CardContent>
            </Card>
        </div>

        {/* Column 3 (Right): Analysis & Details */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Informations & Rentabilité</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-lg">
                           <div>
                                <p className="text-sm text-muted-foreground">Vente TTC</p>
                                {isEditing ? (
                                    <Input 
                                        type="number"
                                        value={editableRecipe?.price}
                                        onChange={(e) => handleRecipeDataChange('price', parseFloat(e.target.value) || 0)}
                                        className="font-bold text-lg text-center"
                                    />
                                ) : (
                                    <p className="font-bold text-lg">{currentRecipeData.price.toFixed(2)}€</p>
                                )}
                           </div>
                           <div>
                                <p className="text-sm text-muted-foreground">Vente HT</p>
                                <p className="font-bold text-lg">{priceHT.toFixed(2)}€</p>
                           </div>
                           <div>
                                <p className="text-sm text-muted-foreground">Portions</p>
                                 {isEditing ? (
                                    <Input 
                                        type="number"
                                        value={editableRecipe?.portions}
                                        onChange={(e) => handleRecipeDataChange('portions', parseInt(e.target.value) || 1)}
                                        className="font-bold text-lg text-center"
                                    />
                                ) : (
                                    <p className="font-bold text-lg">{currentRecipeData.portions}</p>
                                )}
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

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600"/>Allergènes</div>
                         {isEditing && <Button variant="ghost" size="icon" className="h-8 w-8"><FilePen className="h-4 w-4"/></Button>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {recipe.allergens && recipe.allergens.length > 0 ? 
                        recipe.allergens.map(allergen => <Badge key={allergen} variant="secondary">{allergen}</Badge>)
                        : <p className="text-sm text-muted-foreground">Aucun allergène spécifié.</p>
                    }
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5"/>Argumentaire Commercial</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                    {isEditing ? (
                        <Textarea 
                            value={editableRecipe?.commercialArgument}
                            onChange={(e) => handleRecipeDataChange('commercialArgument', e.target.value)}
                            rows={5}
                        />
                    ) : (
                        <p>{recipe.commercialArgument}</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end sticky bottom-4">
            <Card className="p-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg">
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Sauvegarde..." : `Sauvegarder les modifications`}
                </Button>
            </Card>
        </div>
      )}
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
          {/* Column 1 Skeleton */}
          <div className="space-y-8">
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

          {/* Column 2 Skeleton */}
          <div className="space-y-8">
             <Card>
              <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
             <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-40 w-full" /></CardContent>
            </Card>
          </div>
  
          {/* Column 3 Skeleton */}
          <div className="space-y-8">
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
             <Card>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
             <Card>
              <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

    