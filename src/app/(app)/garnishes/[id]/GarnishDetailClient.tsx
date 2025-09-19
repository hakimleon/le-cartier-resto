
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, RecipeIngredientLink, Ingredient, RecipePreparationLink, Preparation, GeneratedIngredient, FullRecipeIngredient, preparationCategories } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, FilePen, FileText, Info, Lightbulb, NotebookText, PlusCircle, Save, Soup, Trash2, Utensils, X, Sparkles, ChevronsUpDown, Check, Users, CookingPot, BookCopy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { replaceRecipeIngredients, replaceRecipePreparations } from "@/app/(app)/menu/actions";
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
import { IngredientModal } from "../../ingredients/IngredientModal";
import { PreparationModal } from "../../preparations/PreparationModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { PreparationConceptOutput } from "@/ai/flows/workshop-flow";


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

        if ((fromType === 'weight' && toType === 'volume') || (fromType === 'volume' && toType === 'weight')) {
             // Basic assumption: 1ml = 1g for water-like density. This is a simplification.
             return fromFactor / toFactor;
        }

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
    
    const finalCost = quantityInBaseUnit * netCostPerGramOrMl;
    return isNaN(finalCost) ? 0 : finalCost;
};


const EditableIngredientRow = ({ ing, handleIngredientChange, handleRemoveExistingIngredient, sortedIngredients }: { ing: FullRecipeIngredient, handleIngredientChange: any, handleRemoveExistingIngredient: any, sortedIngredients: Ingredient[] }) => {
    const [openCombobox, setOpenCombobox] = useState(false);
    return (
        <TableRow key={ing.recipeIngredientId}>
            <TableCell className="font-medium">
                 <div className="flex items-center gap-1">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between">
                                {ing.name || "Choisir..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Rechercher un ingrédient..." />
                                <CommandList>
                                    <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                                    <CommandGroup>
                                        {sortedIngredients.map((sIng) => (
                                            sIng.id ?
                                                <CommandItem key={sIng.id} value={sIng.name} onSelect={() => { handleIngredientChange(ing.recipeIngredientId, 'id', sIng.id!); setOpenCombobox(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", ing.id === sIng.id ? "opacity-100" : "opacity-0")} />
                                                    {sIng.name}
                                                </CommandItem>
                                                : null
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </TableCell>
            <TableCell><Input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(ing.recipeIngredientId, 'quantity', parseFloat(e.target.value) || 0)} className="w-20" /></TableCell>
            <TableCell>{ing.unit}</TableCell>
            <TableCell className="text-right font-semibold">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Retirer l'ingrédient ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir retirer "{ing.name}" de cette recette ? Cette action prendra effet à la sauvegarde.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExistingIngredient(ing.recipeIngredientId)}>Retirer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    )
}

const NewIngredientRow = ({ newIng, handleNewIngredientChange, openNewIngredientModal, handleRemoveNewIngredient, sortedIngredients }: { newIng: NewRecipeIngredient, handleNewIngredientChange: any, openNewIngredientModal: any, handleRemoveNewIngredient: any, sortedIngredients: Ingredient[] }) => {
    const [openCombobox, setOpenCombobox] = useState(false);
    return (
        <TableRow key={newIng.tempId}>
            <TableCell>
                <div className="flex items-center gap-1">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between" >
                                {newIng.ingredientId ? sortedIngredients.find((ing) => ing.id === newIng.ingredientId)?.name : newIng.name || "Choisir..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Rechercher un ingrédient..." />
                                <CommandList>
                                    <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                                    <CommandGroup>
                                        {sortedIngredients.map((ing) => (
                                            ing.id ?
                                                <CommandItem key={ing.id} value={ing.name} onSelect={(currentValue) => { const selected = sortedIngredients.find(i => i.name.toLowerCase() === currentValue.toLowerCase()); if (selected) { handleNewIngredientChange(newIng.tempId, 'ingredientId', selected.id!); } setOpenCombobox(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", newIng.ingredientId === ing.id ? "opacity-100" : "opacity-0")} />
                                                    {ing.name}
                                                </CommandItem>
                                                : null
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {!newIng.ingredientId && newIng.name && (<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openNewIngredientModal(newIng.tempId)} title={'Créer l\'ingrédient "' + newIng.name + '"'}> <PlusCircle className="h-4 w-4 text-primary" /> </Button>)}
                </div>
            </TableCell>
            <TableCell><Input type="number" placeholder="Qté" className="w-20" value={newIng.quantity === 0 ? '' : newIng.quantity} onChange={(e) => handleNewIngredientChange(newIng.tempId, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell>
            <TableCell>{newIng.unit}</TableCell>
            <TableCell className="text-right font-semibold">{(newIng.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveNewIngredient(newIng.tempId)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
        </TableRow>
    )
}

const EditablePreparationRow = ({ prep, handlePreparationChange, handleRemoveExistingPreparation }: { prep: FullRecipePreparation, handlePreparationChange: any, handleRemoveExistingPreparation: any }) => {
    return (
        <TableRow key={prep.id}>
            <TableCell className="font-medium">{prep.name}</TableCell>
            <TableCell><Input type="number" value={prep.quantity} onChange={(e) => handlePreparationChange(prep.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20" /></TableCell>
            <TableCell>{prep.unit}</TableCell>
            <TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Retirer la préparation ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir retirer "{prep.name}" de cette recette ?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExistingPreparation(prep.id)}>Retirer</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    )
}

const NewPreparationRow = ({ prep, handleNewPreparationChange, openNewPreparationModal, handleRemoveNewPreparation, allPreparations, recipeId }: { prep: NewRecipePreparation, handleNewPreparationChange: any, openNewPreparationModal: any, handleRemoveNewPreparation: any, allPreparations: Preparation[], recipeId: string }) => {
    const [openPrepCombobox, setOpenPrepCombobox] = useState(false);
    return (
        <TableRow key={prep.tempId}>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Popover open={openPrepCombobox} onOpenChange={setOpenPrepCombobox}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={openPrepCombobox} className="w-full justify-between">
                                {prep.childPreparationId ? allPreparations.find(p => p.id === prep.childPreparationId)?.name : prep.name || "Choisir..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Rechercher une préparation..." />
                                <CommandList>
                                    <CommandEmpty>Aucune préparation trouvée.</CommandEmpty>
                                    <CommandGroup>
                                        {allPreparations.filter(p => p.id !== recipeId).map(p => (
                                            p.id ? <CommandItem key={p.id} value={p.name} onSelect={() => { handleNewPreparationChange(prep.tempId, 'childPreparationId', p.id!); setOpenPrepCombobox(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4", prep.childPreparationId === p.id ? "opacity-100" : "opacity-0")} />
                                                {p.name}
                                            </CommandItem> : null
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {!prep.childPreparationId && prep.name && (<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openNewPreparationModal(prep.tempId)} title={'Créer la préparation "' + prep.name + '"'}>
                        <PlusCircle className="h-4 w-4 text-primary" />
                    </Button>)}
                </div>
            </TableCell>
            <TableCell><Input type="number" placeholder="Qté" className="w-20" value={prep.quantity === 0 ? '' : prep.quantity} onChange={(e) => handleNewPreparationChange(prep.tempId, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell>
            <TableCell>{prep.unit || "-"}</TableCell>
            <TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveNewPreparation(prep.tempId)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
        </TableRow>
    )
}

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
        try {
            // Fetch all supporting data first
            const ingredientsList = await fetchAllIngredients();
            const allPrepsData = await fetchAllPreparations();
            
            // Mocked costs, to be replaced by real calculation
            const costs: Record<string, number> = {};
            for (const prep of allPrepsData) {
                if (prep.id) {
                    costs[prep.id] = Math.random() * 50; 
                }
            }
            setPreparationsCosts(costs);

            // Fetch the main garnish data
            const recipeDocRef = doc(db, "garnishes", recipeId);
            const recipeSnap = await getDoc(recipeDocRef);

            if (!recipeSnap.exists()) {
                setError("Fiche de garniture non trouvée.");
                setRecipe(null);
                return;
            }

            const fetchedRecipe = { ...recipeSnap.data(), id: recipeSnap.id } as Preparation;
            setRecipe(fetchedRecipe);
            setEditableRecipe(JSON.parse(JSON.stringify(fetchedRecipe)));

            // Fetch and process ingredients for this garnish
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

            // Fetch and process sub-preparations for this garnish
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
        } catch (e: any) {
            console.error("Error on full data refresh:", e);
            setError("Impossible de charger les données: " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, [recipeId]); // Only recipeId should be a stable dependency here

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

    useEffect(() => {
        if (!recipeId || !isFirebaseConfigured) {
            setIsLoading(false);
            setError(recipeId ? "Configuration Firebase manquante." : "ID de garniture manquant.");
            return;
        }

        let isMounted = true;
        
        const initialLoad = async () => {
            await fullDataRefresh();
            if (!isMounted) return;

            const conceptJSON = sessionStorage.getItem(GARNISH_WORKSHOP_CONCEPT_KEY);
            if (conceptJSON) {
                setIsEditing(true);
                const concept: PreparationConceptOutput = JSON.parse(conceptJSON);
                
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
        }

        initialLoad();
        return () => { isMounted = false; };
    }, [recipeId]);


    const handleToggleEditMode = () => {
        if (isEditing) {
            fullDataRefresh(); // Reset changes
            setNewIngredients([]);
            setNewPreparations([]);
        }
        setIsEditing(!isEditing);
    };

    const handleRecipeDataChange = (field: keyof Preparation, value: any) => {
        setEditableRecipe(current => current ? { ...current, [field]: value } : null);
    };

    const handleIngredientChange = (recipeIngredientId: string, field: 'quantity' | 'unit' | 'id', value: any) => {
        setEditableIngredients(current => current.map(ing => {
            if (ing.recipeIngredientId === recipeIngredientId) {
                const updatedIng = { ...ing, [field]: value };
                if(field === 'id') {
                  const newIngData = allIngredients.find(i => i.id === value);
                  if(newIngData) {
                      updatedIng.name = newIngData.name;
                      updatedIng.category = newIngData.category;
                  }
                }
                const ingData = allIngredients.find(i => i.id === updatedIng.id);
                if (ingData) {
                    updatedIng.totalCost = recomputeIngredientCost(updatedIng, ingData);
                }
                return updatedIng;
            }
            return ing;
        }));
    };
  
    const handleNewIngredientChange = (tempId: string, field: keyof NewRecipeIngredient, value: any) => {
        setNewIngredients(current => current.map(ing => {
            if (ing.tempId === tempId) {
            const updatedIng = { ...ing, [field]: value };
            const selectedIngredient = allIngredients.find(i => i.id === updatedIng.ingredientId);
            if (selectedIngredient) {
                if (field === 'ingredientId') {
                updatedIng.name = selectedIngredient.name;
                updatedIng.category = selectedIngredient.category;
                }
                updatedIng.totalCost = recomputeIngredientCost(updatedIng, selectedIngredient);
            } else if(field === 'ingredientId') {
                updatedIng.ingredientId = undefined; // Unlink if not found
            }
            return updatedIng;
            }
            return ing;
        })
        );
    };

    const handleRemoveExistingIngredient = (recipeIngredientId: string) => { setEditableIngredients(current => current.filter(ing => ing.recipeIngredientId !== recipeIngredientId)); };
    const handleRemoveNewIngredient = (tempId: string) => { setNewIngredients(current => current.filter(ing => ing.tempId !== tempId)); };
    
    const openNewIngredientModal = (tempId: string) => {
        const ingredientToCreate = newIngredients.find(ing => ing.tempId === tempId);
        if (ingredientToCreate) {
            setCurrentTempId(tempId);
            setNewIngredientDefaults({ name: ingredientToCreate.name });
            setIsNewIngredientModalOpen(true);
        }
    }

    const handleCreateAndLinkIngredient = (tempId: string, newIngredient: Ingredient) => {
        fetchAllIngredients().then(updatedList => {
            const newlyAdded = updatedList.find(i => i.id === newIngredient.id);
            if (newlyAdded) {
                handleNewIngredientChange(tempId, 'ingredientId', newlyAdded.id!);
            }
        });
    };

    const openNewPreparationModal = (tempId: string) => {
        const prepToCreate = newPreparations.find(p => p.tempId === tempId);
        if (prepToCreate) {
            setCurrentPrepTempId(tempId);
            setNewPreparationDefaults({ name: prepToCreate.name, description: `Préparation pour "${recipe?.name}"` });
            setIsNewPreparationModalOpen(true);
        }
    };

    const handleCreateAndLinkPreparation = (tempId: string, newPreparation: Preparation) => {
        fetchAllPreparations().then(updatedList => {
            const newlyAdded = updatedList.find(p => p.id === newPreparation.id);
            if (newlyAdded) {
                handleNewPreparationChange(tempId, 'childPreparationId', newlyAdded.id!);
            }
        })
    }
    
    const handleRemoveNewPreparation = (tempId: string) => { setNewPreparations(current => current.filter(p => p.tempId !== tempId)); };
    const handleRemoveExistingPreparation = (preparationLinkId: string) => { setEditablePreparations(current => current.filter(p => p.id !== preparationLinkId)); };
    
    const handlePreparationChange = (linkId: string, field: 'quantity', value: any) => {
        setEditablePreparations(current => current.map(prep => {
            if (prep.id === linkId) {
                const updatedPrep = { ...prep, [field]: value };
                const costPerProductionUnit = prep._costPerUnit || 0;
                const conversionFactor = getConversionFactor(prep._productionUnit, updatedPrep.unit);
                const costPerUseUnit = costPerProductionUnit / conversionFactor;
                updatedPrep.totalCost = (updatedPrep.quantity || 0) * costPerUseUnit;
                return updatedPrep;
            }
            return prep;
        }));
    };

    const handleNewPreparationChange = (tempId: string, field: keyof NewRecipePreparation, value: any) => {
        setNewPreparations(current => current.map(p => {
            if (p.tempId === tempId) {
                const updatedPrep = { ...p, [field]: value };
                if (field === 'childPreparationId') {
                    const selectedPrep = allPreparations.find(prep => prep.id === value);
                    if (selectedPrep) {
                        updatedPrep.name = selectedPrep.name;
                        updatedPrep.unit = selectedPrep.usageUnit || selectedPrep.productionUnit || 'g';
                        updatedPrep._costPerUnit = preparationsCosts[selectedPrep.id!] || 0;
                        updatedPrep._productionUnit = selectedPrep.productionUnit || '';
                    } else {
                        updatedPrep.childPreparationId = undefined;
                    }
                }
                if (field === 'quantity' || field === 'childPreparationId') {
                    const costPerProductionUnit = updatedPrep._costPerUnit || 0;
                    const conversionFactor = getConversionFactor(updatedPrep._productionUnit, updatedPrep.unit);
                    const costPerUseUnit = costPerProductionUnit / conversionFactor;
                    updatedPrep.totalCost = (updatedPrep.quantity || 0) * costPerUseUnit;
                }
                return updatedPrep;
            }
            return p;
        })
        );
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
            
            const allCurrentIngredients = [ ...editableIngredients.map(ing => ({ ingredientId: ing.id, quantity: ing.quantity, unitUse: ing.unit })), ...newIngredients.map(ing => ({ ingredientId: ing.ingredientId, quantity: ing.quantity, unitUse: ing.unit }))].filter(ing => ing.ingredientId && ing.quantity > 0) as Omit<RecipeIngredientLink, 'id' | 'recipeId'>[];
            await replaceRecipeIngredients(recipeId, allCurrentIngredients);
            
            const existingPrepLinks = editablePreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit }));
            const newPrepLinks = newPreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit })).filter(p => !!p.childPreparationId);
            const allPrepLinks = [...existingPrepLinks, ...newPrepLinks] as Omit<RecipePreparationLink, 'id'>[];
            await replaceRecipePreparations(recipeId, allPrepLinks);
            
            await fullDataRefresh();
            
            toast({ title: "Succès", description: "La garniture a été sauvegardée." });
            setIsEditing(false); 
            setNewIngredients([]); 
            setNewPreparations([]);
        } catch (error) {
            console.error("Error saving garnish:", error);
            toast({ title: "Erreur", description: "La sauvegarde de la garniture a échoué.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const currentRecipeData = isEditing ? editableRecipe : recipe;
    
    const { totalRecipeCost, costPerPortion } = useMemo(() => {
        if (!currentRecipeData) return { totalRecipeCost: 0, costPerPortion: 0 };
        
        const ingredientsToSum = isEditing ? [...editableIngredients, ...newIngredients] : ingredients;
        const prepsToSum = isEditing ? [...editablePreparations, ...newPreparations] : preparations;

        const ingredientsCost = ingredientsToSum.reduce((acc, item) => acc + (item.totalCost || 0), 0);
        const preparationsCost = prepsToSum.reduce((acc, item) => acc + (item.totalCost || 0), 0);
        const totalCost = ingredientsCost + preparationsCost;

        const portions = currentRecipeData.portions || 1;
        const costPerPortionValue = portions > 0 ? totalCost / portions : 0;
        
        return { totalRecipeCost: totalCost, costPerPortion: costPerPortionValue };
    }, [isEditing, currentRecipeData, ingredients, editableIngredients, newIngredients, preparations, editablePreparations, newPreparations]);
    
    const sortedIngredients = useMemo(() => {
        return [...allIngredients].sort((a, b) => a.name.localeCompare(b.name));
    }, [allIngredients]);

    if (isLoading) return <RecipeDetailSkeleton />;
    if (error) return ( <div className="container mx-auto py-10"><Alert variant="destructive" className="max-w-2xl mx-auto my-10"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div> );
    if (!recipe || !currentRecipeData) return ( <div className="container mx-auto py-10 text-center"><p>Fiche de garniture non trouvée ou erreur de chargement.</p></div> );

    const isRecipeEmpty = ingredients.length === 0 && preparations.length === 0 && !recipe.procedure_preparation;

    return (
        <div className="space-y-4">
            <IngredientModal open={isNewIngredientModalOpen} onOpenChange={setIsNewIngredientModalOpen} ingredient={newIngredientDefaults} onSuccess={(newDbIngredient) => { if (newDbIngredient && currentTempId) { handleCreateAndLinkIngredient(currentTempId, newDbIngredient); } }} ><div /></IngredientModal>
            <PreparationModal open={isNewPreparationModalOpen} onOpenChange={setIsNewPreparationModalOpen} preparation={newPreparationDefaults} onSuccess={(newDbPrep) => { if (newDbPrep && currentPrepTempId) { handleCreateAndLinkPreparation(currentPrepTempId, newDbPrep); } }}><div /></PreparationModal>
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4 flex-grow">
                    <div className="bg-primary/10 text-primary rounded-lg h-14 w-14 flex items-center justify-center shrink-0">
                        <CookingPot className="h-7 w-7" />
                    </div>
                    <div className="w-full space-y-2">
                        {isEditing ? (
                             <Input
                                value={editableRecipe?.name}
                                onChange={(e) => handleRecipeDataChange('name', e.target.value)}
                                className="text-2xl font-bold tracking-tight h-12 w-full"
                            />
                        ) : (
                             <div>
                                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">{recipe.name}</h1>
                                <p className="text-muted-foreground">Garniture • {recipe.category}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {currentRecipeData.duration || '-'} min</div>
                            <div className="flex items-center gap-1.5"><Soup className="h-4 w-4" /> {currentRecipeData.difficulty || '-'}</div>
                            {currentRecipeData.portions && <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {currentRecipeData.portions} portions</div>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" onClick={handleToggleEditMode}>{isEditing ? <><X className="mr-2 h-4 w-4"/>Annuler</> : <><FilePen className="mr-2 h-4 w-4"/>Modifier</>}</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><Utensils className="h-5 w-5"/>Ingrédients</div>
                                {isEditing && <Button variant="outline" size="sm" onClick={() => setNewIngredients(prev => [...prev, { tempId: `new-manual-${Date.now()}`, name: '', quantity: 0, unit: 'g', totalCost: 0, category: '' }])}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter</Button>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[35%]">Ingrédient</TableHead><TableHead>Quantité</TableHead><TableHead>Unité</TableHead><TableHead className="text-right">Coût</TableHead>{isEditing && <TableHead className="w-[50px]"></TableHead>}</TableRow></TableHeader>
                                <TableBody>
                                    {isEditing ? (
                                        <>
                                            {editableIngredients.map(ing => (
                                                <EditableIngredientRow
                                                    key={ing.recipeIngredientId}
                                                    ing={ing}
                                                    handleIngredientChange={handleIngredientChange}
                                                    handleRemoveExistingIngredient={handleRemoveExistingIngredient}
                                                    sortedIngredients={sortedIngredients}
                                                />
                                            ))}
                                            {newIngredients.map(ing => (
                                                 <NewIngredientRow
                                                    key={ing.tempId}
                                                    newIng={ing}
                                                    handleNewIngredientChange={handleNewIngredientChange}
                                                    openNewIngredientModal={openNewIngredientModal}
                                                    handleRemoveNewIngredient={handleRemoveNewIngredient}
                                                    sortedIngredients={sortedIngredients}
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        ingredients.map(ing => (
                                            <TableRow key={ing.recipeIngredientId}>
                                                <TableCell>{ing.name}</TableCell>
                                                <TableCell>{ing.quantity}</TableCell>
                                                <TableCell>{ing.unit}</TableCell>
                                                <TableCell className="text-right">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                     {ingredients.length === 0 && newIngredients.length === 0 && !isEditing && (<TableRow><TableCell colSpan={4} className="text-center h-24">Aucun ingrédient.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><BookCopy className="h-5 w-5" />Sous-Recettes</div>
                                {isEditing && <Button variant="outline" size="sm" onClick={() => setNewPreparations([...newPreparations, { tempId: `new-manual-${Date.now()}`, name: '', quantity: 0, unit: 'g', totalCost: 0, _productionUnit: '' }])}><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button>}
                            </CardTitle>
                            <CardDescription>Liste des préparations (fiches techniques internes) utilisées dans cette garniture.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-1/3">Préparation</TableHead><TableHead>Quantité</TableHead><TableHead>Unité</TableHead><TableHead className="text-right">Coût</TableHead>{isEditing && <TableHead className="w-[50px]"></TableHead>}</TableRow></TableHeader>
                                <TableBody>
                                    {isEditing && editablePreparations.map(prep => (
                                        <EditablePreparationRow
                                            key={prep.id}
                                            prep={prep}
                                            handlePreparationChange={handlePreparationChange}
                                            handleRemoveExistingPreparation={handleRemoveExistingPreparation}
                                        />
                                    ))}
                                    {!isEditing && preparations.map(prep => (
                                        <TableRow key={prep.id}><TableCell className="font-medium">{prep.name}</TableCell><TableCell>{prep.quantity}</TableCell><TableCell>{prep.unit}</TableCell><TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell></TableRow>
                                    ))}
                                    {isEditing && newPreparations.map((prep) => (
                                        <NewPreparationRow
                                            key={prep.tempId}
                                            prep={prep}
                                            handleNewPreparationChange={handleNewPreparationChange}
                                            openNewPreparationModal={openNewPreparationModal}
                                            handleRemoveNewPreparation={handleRemoveNewPreparation}
                                            allPreparations={allPreparations}
                                            recipeId={recipeId}
                                        />
                                    ))}
                                    {preparations.length === 0 && newPreparations.length === 0 && !isEditing && (<TableRow><TableCell colSpan={isEditing ? 5 : 4} className="text-center h-24 text-muted-foreground">Aucune sous-recette ajoutée.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>Procédure</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isEditing ? (
                                <Tabs defaultValue="preparation">
                                    <TabsList><TabsTrigger value="preparation">Préparation</TabsTrigger><TabsTrigger value="cuisson">Cuisson</TabsTrigger><TabsTrigger value="service">Service</TabsTrigger></TabsList>
                                    <TabsContent value="preparation" className="pt-4"><Textarea value={editableRecipe?.procedure_preparation} onChange={(e) => handleRecipeDataChange('procedure_preparation', e.target.value)} rows={8}/></TabsContent>
                                    <TabsContent value="cuisson" className="pt-4"><Textarea value={editableRecipe?.procedure_cuisson} onChange={(e) => handleRecipeDataChange('procedure_cuisson', e.target.value)} rows={8} /></TabsContent>
                                    <TabsContent value="service" className="pt-4"><Textarea value={editableRecipe?.procedure_service} onChange={(e) => handleRecipeDataChange('procedure_service', e.target.value)} rows={8} /></TabsContent>
                                </Tabs>
                           ) : (
                                <Tabs defaultValue="preparation">
                                    <TabsList>
                                        <TabsTrigger value="preparation">Préparation</TabsTrigger>
                                        <TabsTrigger value="cuisson">Cuisson</TabsTrigger>
                                        <TabsTrigger value="service">Service/Stockage</TabsTrigger>
                                    </TabsList>
                                     <TabsContent value="preparation" className="pt-4">
                                        <MarkdownRenderer text={recipe.procedure_preparation} />
                                    </TabsContent>
                                    <TabsContent value="cuisson" className="pt-4">
                                        <MarkdownRenderer text={recipe.procedure_cuisson} />
                                    </TabsContent>
                                    <TabsContent value="service" className="pt-4">
                                        <MarkdownRenderer text={recipe.procedure_service} />
                                    </TabsContent>
                                </Tabs>
                           )}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Coût Total Matières</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-right">{totalRecipeCost.toFixed(2)} DZD</div>
                            <p className="text-xs text-muted-foreground text-right mt-1">Coût par portion : {costPerPortion.toFixed(2)} DZD</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Production & Portions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>Production Totale</Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" value={editableRecipe?.productionQuantity || 1} onChange={(e) => handleRecipeDataChange('productionQuantity', parseFloat(e.target.value) || 1)} className="w-1/2" />
                                            <Input value={editableRecipe?.productionUnit || ''} onChange={(e) => handleRecipeDataChange('productionUnit', e.target.value)} placeholder="Unité (kg, L)" className="w-1/2"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nombre de Portions</Label>
                                        <Input type="number" value={editableRecipe?.portions || ''} onChange={(e) => handleRecipeDataChange('portions', parseInt(e.target.value) || undefined)} placeholder="Ex: 10" />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Production totale:</span> <span className="font-semibold">{currentRecipeData.productionQuantity} {currentRecipeData.productionUnit}</span></div>
                                    <div className="flex justify-between"><span>Nombre de portions:</span> <span className="font-semibold">{currentRecipeData.portions || "-"}</span></div>
                                    <div className="flex justify-between"><span>Poids par portion:</span> <span className="font-semibold">{currentRecipeData.portions && currentRecipeData.productionQuantity ? (currentRecipeData.productionQuantity / currentRecipeData.portions * 1000).toFixed(0) : '-'} g</span></div>
                                    <Separator/>
                                    <div className="flex justify-between text-base">
                                        <span className="text-primary font-semibold">Coût / portion:</span>
                                        <span className="font-bold text-primary">{costPerPortion.toFixed(2)} DZD</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
    
            {isEditing && (<div className="fixed bottom-6 right-6 z-50"><Card className="p-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg"><Button onClick={handleSave} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? "Sauvegarde..." : 'Sauvegarder'}</Button></Card></div>)}
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

    