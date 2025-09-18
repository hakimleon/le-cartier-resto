
"use client";

// This is a copy of preparations-base/[id]/RecipeDetailClient.tsx
// It needs to be adapted to fetch from 'garnishes' collection and use garnish-specific actions.
// For now, it's a placeholder to make the file structure work.

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
import { generateGarnishConcept } from "@/ai/flows/garnish-workshop-flow";
import { IngredientModal } from "../../ingredients/IngredientModal";
import { PreparationModal } from "../../preparations/PreparationModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RecipeConceptOutput } from "@/ai/flows/recipe-workshop-flow";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from "@/components/ui/dialog";


const GARNISH_WORKSHOP_CONCEPT_KEY = 'garnishWorkshopGeneratedConcept';

type RecipeDetailClientProps = {
  recipeId: string;
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

// Component Definition
export default function GarnishDetailClient({ recipeId }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Preparation | null>(null);
  const [editableRecipe, setEditableRecipe] = useState<Preparation | null>(null);
  
  const [ingredients, setIngredients] = useState<FullRecipeIngredient[]>([]);
  const [editableIngredients, setEditableIngredients] = useState<FullRecipeIngredient[]>([]);
  
  const [preparations, setPreparations] = useState<FullRecipePreparation[]>([]);
  const [editablePreparations, setEditablePreparations] = useState<FullRecipePreparation[]>([]);
  const [newPreparations, setNewPreparations] = useState<NewRecipePreparation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  
  const [newIngredients, setNewIngredients] = useState<NewRecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allPreparations, setAllPreparations] = useState<Preparation[]>([]);
  const [preparationsCosts, setPreparationsCosts] = useState<Record<string, number>>({});
  
  const [derivedSuggestions, setDerivedSuggestions] = useState<DerivedPreparationsOutput['suggestions'] | null>(null);
  const [generatedConcept, setGeneratedConcept] = useState<RecipeConceptOutput | null>(null);


  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);
  const [isNewPreparationModalOpen, setIsNewPreparationModalOpen] = useState(false);
  const [newIngredientDefaults, setNewIngredientDefaults] = useState<Partial<Ingredient> | null>(null);
  const [newPreparationDefaults, setNewPreparationDefaults] = useState<Partial<Preparation> | null>(null);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);
  const [currentPrepTempId, setCurrentPrepTempId] = useState<string | null>(null);

  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionState, setSuggestionState] = useState<{
      isLoading: boolean;
      ingredientName: string;
      ingredientId: string;
      isNew: boolean;
      suggestions: IngredientAlternativeOutput['suggestions'] | null;
  }>({ isLoading: false, ingredientName: '', ingredientId: '', isNew: false, suggestions: null });
  
  const calculatePreparationsCosts = useCallback(async (prepsList: Preparation[], ingList: Ingredient[]): Promise<Record<string, number>> => {
      // Simplified cost calculation for example
      return {};
  }, []);

  const fetchAllIngredients = useCallback(async () => {
    const allIngredientsSnap = await getDocs(query(collection(db, "ingredients")));
    const ingredientsList = allIngredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
    setAllIngredients(ingredientsList);
    return ingredientsList;
  }, []);

   const fetchAllPreparations = useCallback(async () => {
        const allPrepsSnap = await getDocs(query(collection(db, "preparations")));
        const prepsList = allPrepsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));
        setAllPreparations(prepsList);
        return prepsList;
    }, []);

    const fullDataRefresh = useCallback(async () => {
        const ingredientsList = await fetchAllIngredients();
        const allPrepsData = await fetchAllPreparations();
        const costs = await calculatePreparationsCosts(allPrepsData, ingredientsList);
        setPreparationsCosts(costs);

        const collectionName = "garnishes";
        const recipeDocRef = doc(db, collectionName, recipeId);
        const recipeSnap = await getDoc(recipeDocRef);

        if (!recipeSnap.exists()) {
            setError("Fiche de garniture non trouvée.");
            setRecipe(null);
            setIsLoading(false);
            return;
        }

        const fetchedRecipe = { ...recipeSnap.data(), id: recipeSnap.id } as Preparation;
        setRecipe(fetchedRecipe);
        setEditableRecipe(JSON.parse(JSON.stringify(fetchedRecipe)));

        const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", recipeId));
        const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
        const ingredientsData = recipeIngredientsSnap.docs.map(docSnap => {
            const recipeIngredientData = docSnap.data() as RecipeIngredientLink;
            const ingredientData = ingredientsList.find(i => i.id === recipeIngredientData.ingredientId);
            if (ingredientData) {
                const totalCost = recomputeIngredientCost(recipeIngredientData, ingredientData);
                return { id: ingredientData.id!, recipeIngredientId: docSnap.id, name: ingredientData.name, quantity: recipeIngredientData.quantity, unit: recipeIngredientData.unitUse, category: ingredientData.category, totalCost };
            }
            return null;
        }).filter(Boolean) as FullRecipeIngredient[];
        setIngredients(ingredientsData);
        setEditableIngredients(JSON.parse(JSON.stringify(ingredientsData)));

        const recipePreparationsQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", recipeId));
        const recipePreparationsSnap = await getDocs(recipePreparationsQuery);
        const preparationsData = recipePreparationsSnap.docs.map(linkDoc => {
            const linkData = linkDoc.data() as RecipePreparationLink;
            const childRecipeData = allPrepsData.find(p => p.id === linkData.childPreparationId);
            if (childRecipeData && costs[linkData.childPreparationId] !== undefined) {
                const costPerProductionUnit = costs[linkData.childPreparationId];
                const conversionFactor = getConversionFactor(childRecipeData.productionUnit!, linkData.unitUse);
                const costPerUseUnit = costPerProductionUnit / conversionFactor;
                return { id: linkDoc.id, childPreparationId: linkData.childPreparationId, name: childRecipeData.name, quantity: linkData.quantity, unit: linkData.unitUse, totalCost: costPerUseUnit * (linkData.quantity || 0), _costPerUnit: costPerProductionUnit, _productionUnit: childRecipeData.productionUnit! };
            }
            return null;
        }).filter(Boolean) as FullRecipePreparation[];
        setPreparations(preparationsData);
        setEditablePreparations(JSON.parse(JSON.stringify(preparationsData)));

    }, [recipeId, calculatePreparationsCosts, fetchAllIngredients, fetchAllPreparations]);


    useEffect(() => {
        if (!recipeId) { setIsLoading(false); setError("L'identifiant de la garniture est manquant."); return; }
        if (!isFirebaseConfigured) { setError("La configuration de Firebase est manquante."); setIsLoading(false); return; }
        
        let isMounted = true;
        
        const initialLoad = async () => {
            try {
                setIsLoading(true);
                await fullDataRefresh();
                 const conceptJSON = sessionStorage.getItem(GARNISH_WORKSHOP_CONCEPT_KEY);
                if (conceptJSON && isMounted) {
                    setIsEditing(true);
                    const concept: RecipeConceptOutput = JSON.parse(conceptJSON);

                    setEditableRecipe(current => ({ ...current!, ...concept }));
                    
                    const ingredientsList = await fetchAllIngredients();
                    const newIngs: NewRecipeIngredient[] = (concept.ingredients || []).map(sugIng => {
                        const existing = ingredientsList.find(dbIng => dbIng.name.toLowerCase() === sugIng.name.toLowerCase());
                        let totalCost = existing ? recomputeIngredientCost({ quantity: sugIng.quantity, unit: sugIng.unit }, existing) : 0;
                        return { tempId: `new-ws-ing-${Date.now()}-${Math.random()}`, ingredientId: existing?.id, name: existing?.name || sugIng.name, quantity: sugIng.quantity, unit: sugIng.unit, totalCost: isNaN(totalCost) ? 0 : totalCost, category: existing?.category || '' };
                    });
                    setNewIngredients(newIngs);
                    
                    const allPrepsList = await fetchAllPreparations();
                    const newPreps: NewRecipePreparation[] = (concept.subRecipes || []).map(prep => {
                         const existing = allPrepsList.find(dbPrep => dbPrep.name.toLowerCase() === prep.name.toLowerCase());
                        return { tempId: `new-ws-prep-${Date.now()}-${Math.random()}`, childPreparationId: existing?.id, name: existing?.name || prep.name, quantity: prep.quantity, unit: prep.unit, totalCost: 0, _costPerUnit: existing ? preparationsCosts[existing.id!] || 0 : 0, _productionUnit: existing?.productionUnit || '' };
                    });
                    setNewPreparations(newPreps);

                    toast({ title: "Fiche importée de l'Atelier !", description: "Vérifiez et sauvegardez les informations." });
                    sessionStorage.removeItem(GARNISH_WORKSHOP_CONCEPT_KEY);
                }
            } catch(e: any) {
                 console.error("Error during initial load: ", e);
                if (isMounted) { setError("Impossible de charger les données. " + e.message); }
            } finally {
                if(isMounted) setIsLoading(false);
            }
        }

        initialLoad();

        return () => { isMounted = false; };
    }, [recipeId, fullDataRefresh, fetchAllIngredients, fetchAllPreparations]);


    const handleToggleEditMode = () => setIsEditing(!isEditing);
    const handleRecipeDataChange = (field: keyof Preparation, value: any) => {
        if (editableRecipe) { setEditableRecipe({ ...editableRecipe, [field]: value }); }
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
            await updateDoc(doc(db, "garnishes", recipeId), recipeDataToSave);
            
            // Simplified ingredient/prep saving logic for this placeholder
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
            setGeneratedConcept(null);
    
        } catch (error) { console.error("Error saving changes:", error); toast({ title: "Erreur", description: "La sauvegarde des modifications a échoué.", variant: "destructive", });
        } finally { setIsSaving(false); }
      };

    const currentRecipeData = isEditing ? editableRecipe : recipe;
    const { totalRecipeCost } = useMemo(() => {
        if (!currentRecipeData) return { totalRecipeCost: 0 };
        // Simplified cost for placeholder
        return { totalRecipeCost: 100 };
    }, [currentRecipeData, ingredients, editableIngredients, newIngredients, preparations, editablePreparations, newPreparations, isEditing]);


    if (isLoading) return <RecipeDetailSkeleton />;
    if (error) return ( <div className="container mx-auto py-10"><Alert variant="destructive" className="max-w-2xl mx-auto my-10"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div> );
    if (!recipe || !currentRecipeData) return ( <div className="container mx-auto py-10 text-center"><p>Fiche de garniture non trouvée ou erreur de chargement.</p></div> );

    const isRecipeEmpty = ingredients.length === 0 && preparations.length === 0 && !recipe.procedure_preparation;

    return (
        <div className="space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4 flex-grow">
                <div className="bg-primary/10 text-primary rounded-lg h-14 w-14 flex items-center justify-center shrink-0">
                    <CookingPot className="h-7 w-7" />
                </div>
                <div className="w-full space-y-2">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input
                                value={editableRecipe?.name}
                                onChange={(e) => handleRecipeDataChange('name', e.target.value)}
                                className="text-2xl font-bold tracking-tight h-12 w-full"
                            />
                            <Select value={editableRecipe?.category} onValueChange={(value) => handleRecipeDataChange('category', value)}>
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Choisir une catégorie..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {preparationCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">{recipe.name}</h1>
                            <p className="text-muted-foreground">Garniture • {recipe.category}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {recipe.duration || '-'} min</div>
                        <div className="flex items-center gap-1.5"><Soup className="h-4 w-4" /> {recipe.difficulty || '-'}</div>
                        {(recipe as Preparation).portions && <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {(recipe as Preparation).portions} portions</div>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" onClick={handleToggleEditMode}>{isEditing ? <><X className="mr-2 h-4 w-4"/>Annuler</> : <><FilePen className="mr-2 h-4 w-4"/>Modifier</>}</Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Simplified content for garnish detail */}
                <Card>
                    <CardHeader><CardTitle>Ingrédients</CardTitle></CardHeader>
                    <CardContent><p>Listing des ingrédients...</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Procédure</CardTitle></CardHeader>
                    <CardContent><p>Détails de la procédure...</p></CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>Coût Total</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-right">{totalRecipeCost.toFixed(2)} DZD</div></CardContent>
                </Card>
                 <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Production & Coût</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Production totale</span>
                            <span className="font-semibold">{currentRecipeData.productionQuantity} {currentRecipeData.productionUnit}</span>
                        </div>
                            <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Nombre de portions</span>
                            <span className="font-semibold">{(currentRecipeData as Preparation).portions || "-"}</span>
                        </div>
                            <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Unité d'utilisation</span>
                            <span className="font-semibold">{(currentRecipeData as Preparation).usageUnit || "-"}</span>
                        </div>
                        <Separator />
                            <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Coût de revient / {currentRecipeData.productionUnit || 'unité'}</span>
                            <span className="font-bold text-primary text-base">{(totalRecipeCost / (currentRecipeData.productionQuantity || 1)).toFixed(2)} DZD</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
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
          <div className="lg:col-span-2 space-y-8"><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>
          <div className="space-y-8"><Card><CardHeader><Skeleton className="h-6 w-24" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card></div>
        </div>
      </div>
    );
}
