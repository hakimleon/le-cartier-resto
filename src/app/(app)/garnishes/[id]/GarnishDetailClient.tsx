
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
import { AlertTriangle, Clock, FilePen, FileText, Info, Lightbulb, NotebookText, PlusCircle, Save, Soup, Trash2, Utensils, X, Sparkles, ChevronsUpDown, Check, Users, CookingPot } from "lucide-react";
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
import { computeIngredientCost, getConversionFactor } from "@/utils/unitConverter";


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
    const [searchTerm, setSearchTerm] = useState("");

    const handleSelect = (currentValue: string) => {
        const selected = sortedIngredients.find(i => i.name.toLowerCase() === currentValue.toLowerCase());
        if (selected) {
            handleNewIngredientChange(newIng.tempId, 'ingredientId', selected.id!);
        }
        setOpenCombobox(false);
        setSearchTerm("");
    };

    const handleCreateNew = () => {
        handleNewIngredientChange(newIng.tempId, 'name', searchTerm);
        openNewIngredientModal(newIng.tempId);
        setOpenCombobox(false);
        setSearchTerm("");
    }

    const filteredAndSorted = sortedIngredients.filter(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
        <TableRow key={newIng.tempId}>
            <TableCell>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className={cn(
                                "w-full justify-between font-normal",
                                !newIng.ingredientId && "border-dashed border-destructive text-destructive"
                            )}
                        >
                            {newIng.ingredientId ? sortedIngredients.find((ing) => ing.id === newIng.ingredientId)?.name : newIng.name || "Choisir ou créer..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                           <CommandInput
                                placeholder="Rechercher ou créer..."
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                            />
                            <CommandList>
                                 <CommandGroup>
                                    {filteredAndSorted.map((ing) => (
                                        <CommandItem
                                            key={ing.id}
                                            value={ing.name}
                                            onSelect={handleSelect}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", newIng.ingredientId === ing.id ? "opacity-100" : "opacity-0")} />
                                            {ing.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandEmpty>
                                    {searchTerm.length > 1 ? (
                                        <div 
                                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                            onClick={handleCreateNew}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Créer l'ingrédient "{searchTerm}"
                                        </div>
                                    ) : "Aucun ingrédient trouvé."}
                                </CommandEmpty>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>
            <TableCell><Input type="number" placeholder="Qté" className="w-20" value={newIng.quantity === 0 ? '' : newIng.quantity} onChange={(e) => handleNewIngredientChange(newIng.tempId, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell>
            <TableCell>{newIng.unit}</TableCell>
            <TableCell className="text-right font-semibold">{(newIng.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveNewIngredient(newIng.tempId)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
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
                    const { cost, error } = computeIngredientCost(ingredientData, recipeIngredientData.quantity, recipeIngredientData.unitUse);
                    if (error) {
                        toast({ title: `Erreur de calcul pour ${ingredientData.name}`, description: error, variant: 'destructive'});
                    }
                    return { id: ingredientData.id!, recipeIngredientId: docSnap.id, name: ingredientData.name, quantity: recipeIngredientData.quantity, unit: recipeIngredientData.unitUse, category: ingredientData.category, totalCost: cost };
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
                    const conversionFactor = getConversionFactor(childRecipeData.productionUnit || 'g', linkData.unitUse, childRecipeData);
                    const costPerUseUnit = conversionFactor > 0 ? costPerProductionUnit / conversionFactor : 0;
                    return { id: linkDoc.id, childPreparationId: linkData.childPreparationId, name: childRecipeData.name, quantity: linkData.quantity, unit: linkData.unitUse, totalCost: costPerUseUnit * (linkData.quantity || 0), _costPerUnit: costPerProductionUnit, _productionUnit: childRecipeData.productionUnit || 'g' };
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
    }, [recipeId, toast]); // Only recipeId should be a stable dependency here

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
                    const { cost } = existing ? computeIngredientCost(existing, sugIng.quantity, sugIng.unit) : { cost: 0 };
                    return { tempId: `new-ws-ing-${Date.now()}-${Math.random()}`, ingredientId: existing?.id, name: existing?.name || sugIng.name, quantity: sugIng.quantity, unit: sugIng.unit, totalCost: cost, category: existing?.category || '' };
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
    }, [recipeId, fetchAllIngredients, fetchAllPreparations, fullDataRefresh, preparationsCosts, toast]);


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
                    const { cost } = computeIngredientCost(ingData, updatedIng.quantity, updatedIng.unit);
                    updatedIng.totalCost = cost;
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
                const { cost } = computeIngredientCost(selectedIngredient, updatedIng.quantity, updatedIng.unit);
                updatedIng.totalCost = cost;
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
                procedure_fabrication: editableRecipe.procedure_fabrication,
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

    const isRecipeEmpty = ingredients.length === 0 && preparations.length === 0 && !recipe.procedure_fabrication;

    return (
        <div className="space-y-4">
            <IngredientModal open={isNewIngredientModalOpen} onOpenChange={setIsNewIngredientModalOpen} ingredient={newIngredientDefaults} onSuccess={(newDbIngredient) => { if (newDbIngredient && currentTempId) { handleCreateAndLinkIngredient(currentTempId, newDbIngredient); } }} ><div /></IngredientModal>
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
                            <CardTitle>Procédure</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isEditing ? (
                                <Tabs defaultValue="fabrication">
                                    <TabsList><TabsTrigger value="fabrication">Fabrication</TabsTrigger><TabsTrigger value="service">Service</TabsTrigger></TabsList>
                                    <TabsContent value="fabrication" className="pt-4"><Textarea value={editableRecipe?.procedure_fabrication} onChange={(e) => handleRecipeDataChange('procedure_fabrication', e.target.value)} rows={8}/></TabsContent>
                                    <TabsContent value="service" className="pt-4"><Textarea value={editableRecipe?.procedure_service} onChange={(e) => handleRecipeDataChange('procedure_service', e.target.value)} rows={8} /></TabsContent>
                                </Tabs>
                           ) : (
                                <Tabs defaultValue="fabrication">
                                    <TabsList>
                                        <TabsTrigger value="fabrication">Fabrication</TabsTrigger>
                                        <TabsTrigger value="service">Service/Stockage</TabsTrigger>
                                    </TabsList>
                                     <TabsContent value="fabrication" className="pt-4">
                                        <MarkdownRenderer text={recipe.procedure_fabrication} />
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

    