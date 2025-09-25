
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, RecipeIngredientLink, Ingredient, RecipePreparationLink, Preparation, GeneratedIngredient, FullRecipeIngredient, preparationCategories } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChefHat, Clock, Euro, FilePen, FileText, Image as ImageIcon, Info, Lightbulb, ListChecks, NotebookText, PlusCircle, Save, Soup, Trash2, Utensils, X, Star, CheckCircle2, Shield, CircleX, BookCopy, Sparkles, ChevronsUpDown, Check, Merge, Replace, Users, CookingPot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateRecipeDetails, addRecipePreparationLink, deleteRecipePreparationLink, updateRecipePreparationLink, replaceRecipeIngredients, replaceRecipePreparations } from "@/app/(app)/menu/actions";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
import { generateDerivedPreparations, generateIngredientAlternative, IngredientAlternativeOutput } from "@/ai/flows/suggestion-flow";
import { generateRecipeConcept } from "@/ai/flows/recipe-workshop-flow";
import { IngredientModal } from "../../ingredients/IngredientModal";
import { PreparationModal } from "../PreparationModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RecipeConceptOutput } from "@/ai/flows/recipe-workshop-flow";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from "@/components/ui/dialog";
import { PrintLink } from "@/components/pdf/PrintLink";


const PREPARATION_WORKSHOP_CONCEPT_KEY = 'preparationWorkshopGeneratedConcept';

type RecipeDetailClientProps = {
  recipeId: string;
  collectionName: 'preparations' | 'garnishes';
};

type NewRecipeIngredient = {
    tempId: string;
    ingredientId?: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    totalCost: number;
};

type FullRecipePreparation = {
    id: string;
    childPreparationId: string;
    name: string;
    quantity: number;
    unit: string;
    totalCost: number;
    _costPerUnit?: number;
    _productionUnit: string;
}

type NewRecipePreparation = {
    tempId: string;
    childPreparationId?: string;
    name: string;
    quantity: number;
    unit: string;
    totalCost: number;
    _costPerUnit?: number;
    _productionUnit: string;
};

const getConversionFactor = (fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit || fromUnit.toLowerCase().trim() === toUnit.toLowerCase().trim()) return 1;

    const u = (unit: string) => unit.toLowerCase().trim();
    const factors: Record<string, number> = {
        'kg': 1000, 'g': 1, 'mg': 0.001,
        'l': 1000, 'ml': 1,
        'litre': 1000, 'litres': 1000,
        'pièce': 1, 'piece': 1, 'botte': 1,
    };
    
    const fromFactor = factors[u(fromUnit)];
    const toFactor = factors[u(toUnit)];

    if (fromFactor !== undefined && toFactor !== undefined) {
        const weightUnits = ['kg', 'g', 'mg'];
        const volumeUnits = ['l', 'ml', 'litre', 'litres'];
        const unitUnits = ['pièce', 'piece', 'botte'];

        const fromType = weightUnits.includes(u(fromUnit)) ? 'weight' : volumeUnits.includes(u(fromUnit)) ? 'volume' : 'unit';
        const toType = weightUnits.includes(u(toUnit)) ? 'weight' : volumeUnits.includes(u(toUnit)) ? 'volume' : 'unit';

        if (fromType === toType) {
            return fromFactor / toFactor;
        }
    }
    
    return 1;
};

const recomputeIngredientCost = (ingredientLink: {quantity: number, unit: string}, ingredientData: Ingredient): number => {
    if (!ingredientData?.purchasePrice || !ingredientData?.purchaseWeightGrams) {
        return 0;
    }

    const costPerGramOrMl = ingredientData.purchasePrice / ingredientData.purchaseWeightGrams;
    const netCostPerGramOrMl = costPerGramOrMl / ((ingredientData.yieldPercentage || 100) / 100);

    const isLiquid = ['l', 'ml', 'litres'].includes(ingredientData.purchaseUnit.toLowerCase());
    const targetUnit = isLiquid ? 'ml' : 'g';
    
    const quantityInBaseUnit = ingredientLink.quantity * getConversionFactor(ingredientLink.unit, targetUnit);
    
    return quantityInBaseUnit * netCostPerGramOrMl;
};


export default function RecipeDetailClient({ recipeId, collectionName }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Preparation | null>(null);
  const [editableRecipe, setEditableRecipe] = useState<Preparation | null>(null);
  
  const [ingredients, setIngredients] = useState<FullRecipeIngredient[]>([]);
  const [editableIngredients, setEditableIngredients] = useState<FullRecipeIngredient[]>([]);
  
  const [preparations, setPreparations] = useState<FullRecipePreparation[]>([]);
  const [editablePreparations, setEditablePreparations] = useState<FullRecipePreparation[]>([]);
  const [newPreparations, setNewPreparations] = useState<NewRecipePreparation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  
  const [newIngredients, setNewIngredients] = useState<NewRecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allPreparations, setAllPreparations] = useState<Preparation[]>([]);
  const [preparationsCosts, setPreparationsCosts] = useState<Record<string, number>>({});
  
  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);
  const [isNewPreparationModalOpen, setIsNewPreparationModalOpen] = useState(false);
  const [newIngredientDefaults, setNewIngredientDefaults] = useState<Partial<Ingredient> | null>(null);
  const [newPreparationDefaults, setNewPreparationDefaults] = useState<Partial<Preparation> | null>(null);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);
  const [currentPrepTempId, setCurrentPrepTempId] = useState<string | null>(null);
  
    const fullDataRefresh = useCallback(async () => {
        setIsLoading(true);
        // Implement data fetching logic here, using `collectionName`
        // For brevity, this part is simplified
        try {
            const recipeDocRef = doc(db, collectionName, recipeId);
            const recipeSnap = await getDoc(recipeDocRef);

            if (!recipeSnap.exists()) {
                setError("Fiche technique non trouvée.");
                setRecipe(null);
                return;
            }

            const fetchedRecipe = { ...recipeSnap.data(), id: recipeSnap.id } as Preparation;
            setRecipe(fetchedRecipe);
            setEditableRecipe(JSON.parse(JSON.stringify(fetchedRecipe)));

            // Fetch ingredients and preparations
            // ... (rest of the data fetching logic)

        } catch (e: any) {
            setError("Erreur de chargement: " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, [recipeId, collectionName]);

    useEffect(() => {
        fullDataRefresh();
    }, [fullDataRefresh]);

  const handleToggleEditMode = () => {
    if (isEditing) {
        if(recipe) setEditableRecipe(JSON.parse(JSON.stringify(recipe)));
        if(ingredients) setEditableIngredients(JSON.parse(JSON.stringify(ingredients)));
        if(preparations) setEditablePreparations(JSON.parse(JSON.stringify(preparations)));
        setNewIngredients([]);
        setNewPreparations([]);
    }
    setIsEditing(!isEditing);
  };
  
    const handleRecipeDataChange = (field: keyof Preparation, value: any) => {
        setEditableRecipe(current => current ? { ...current, [field]: value } : null);
    };

    const handleSave = async () => {
        if (!editableRecipe) return;
        setIsSaving(true);
        try {
            const recipeDataToSave: Partial<Preparation> = {
                name: editableRecipe.name,
                description: editableRecipe.description,
                category: editableRecipe.category,
                difficulty: editableRecipe.difficulty,
                duration: editableRecipe.duration,
                procedure_preparation: editableRecipe.procedure_preparation,
                procedure_cuisson: editableRecipe.procedure_cuisson,
                procedure_service: editableRecipe.procedure_service,
                portions: editableRecipe.portions,
                productionQuantity: editableRecipe.productionQuantity,
                productionUnit: editableRecipe.productionUnit,
                usageUnit: editableRecipe.usageUnit,
            };
            await updateRecipeDetails(recipeId, recipeDataToSave, collectionName);
            
            const allCurrentIngredients = [ ...editableIngredients.map(ing => ({ ingredientId: ing.id, quantity: ing.quantity, unitUse: ing.unit })), ...newIngredients.map(ing => ({ ingredientId: ing.ingredientId, quantity: ing.quantity, unitUse: ing.unit }))].filter(ing => ing.ingredientId && ing.quantity > 0) as Omit<RecipeIngredientLink, 'id' | 'recipeId'>[];
            await replaceRecipeIngredients(recipeId, allCurrentIngredients);
            
            const existingPrepLinks = editablePreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit }));
            const newPrepLinks = newPreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit })).filter(p => !!p.childPreparationId);
            const allPrepLinks = [...existingPrepLinks, ...newPrepLinks] as Omit<RecipePreparationLink, 'id'>[];
            await replaceRecipePreparations(recipeId, allPrepLinks);
            
            await fullDataRefresh();
            
            toast({ title: "Succès", description: "Les modifications ont été sauvegardées." });
            setIsEditing(false); 
            setNewIngredients([]); 
            setNewPreparations([]);

        } catch (error) { console.error("Error saving changes:", error); toast({ title: "Erreur", description: "La sauvegarde des modifications a échoué.", variant: "destructive", });
        } finally { setIsSaving(false); }
    };

  const currentRecipeData = isEditing ? editableRecipe : recipe;
  const isGarnish = collectionName === 'garnishes';
  
  const { totalRecipeCost, costPerPortion, } = useMemo(() => {
    if (!currentRecipeData) { return { totalRecipeCost: 0, costPerPortion: 0 }; }
    
    const ingredientsToSum = isEditing ? [...editableIngredients, ...newIngredients] : ingredients;
    const prepsToSum = isEditing ? [...editablePreparations, ...newPreparations] : preparations;

    const ingredientsCost = ingredientsToSum.reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const preparationsCost = prepsToSum.reduce((acc, item) => acc + (item.totalCost || 0), 0);

    const totalCost = ingredientsCost + preparationsCost;
    
    const portions = currentRecipeData.portions || 1;
    const costPerPortionValue = portions > 0 ? totalCost / portions : 0;
    
    return { totalRecipeCost: totalCost, costPerPortion: costPerPortionValue };
  }, [currentRecipeData, ingredients, editableIngredients, newIngredients, preparations, editablePreparations, newPreparations, isEditing]);


  if (isLoading) { return <RecipeDetailSkeleton />; }
  if (error) { return ( <div className="container mx-auto py-10"><Alert variant="destructive" className="max-w-2xl mx-auto my-10"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div> ); }
  if (!recipe || !currentRecipeData) { return ( <div className="container mx-auto py-10 text-center"><p>Fiche technique non trouvée ou erreur de chargement.</p></div> ); }
  

  return (
    <div className="space-y-4">
      {/* Modals will be here */}

      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-grow">
            <div className={cn("rounded-lg h-14 w-14 flex items-center justify-center shrink-0", isGarnish ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                {isGarnish ? <CookingPot className="h-7 w-7" /> : <NotebookText className="h-7 w-7" />}
            </div>
            <div className="w-full space-y-2">
                 {isEditing ? (
                    <div className="space-y-2">
                        <Input
                            value={editableRecipe?.name || ''}
                            onChange={(e) => handleRecipeDataChange('name', e.target.value)}
                            className="text-2xl font-bold tracking-tight h-12 w-full"
                        />
                         <Input
                            value={editableRecipe?.category || ''}
                            onChange={(e) => handleRecipeDataChange('category', e.target.value)}
                            className="w-[280px]"
                        />
                    </div>
                ) : (
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">{recipe.name}</h1>
                        <p className="text-muted-foreground">{isGarnish ? 'Garniture' : 'Préparation'} • {recipe.category}</p>
                    </div>
                )}
                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {currentRecipeData.duration || '-'} min</div>
                    <div className="flex items-center gap-1.5"><Soup className="h-4 w-4" /> {currentRecipeData.difficulty || 'Moyen'}</div>
                    {currentRecipeData.portions && <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {currentRecipeData.portions} portions</div>}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
             <PrintLink recipe={recipe} ingredients={ingredients} preparations={preparations} totalCost={totalRecipeCost} />
            <Button variant="outline" onClick={handleToggleEditMode}>{isEditing ? <><X className="mr-2 h-4 w-4"/>Annuler</> : <><FilePen className="mr-2 h-4 w-4"/>Modifier</>}</Button>
        </div>
      </header>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Ingredients and Sub-recipes cards here */}
        </div>

        <div className="space-y-8">
            {/* Cost and Production cards here */}
        </div>
      </div>

      {isEditing && (<div className="fixed bottom-6 right-6 z-50"><Card className="p-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg"><Button onClick={handleSave} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? "Sauvegarde..." : 'Sauvegarder les modifications'}</Button></Card></div>)}
    </div>
  );
}

function RecipeDetailSkeleton() {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between"><div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-lg" /><div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-32" /></div></div><Skeleton className="h-10 w-24" /></header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8"><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>
          <div className="space-y-8"><Card><CardHeader><Skeleton className="h-6 w-24" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-3/4" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card></div>
        </div>
      </div>
    );
}
