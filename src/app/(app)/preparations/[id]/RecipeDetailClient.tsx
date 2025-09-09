
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, RecipeIngredientLink, Ingredient, RecipePreparationLink, Preparation, GeneratedIngredient } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChefHat, Clock, Euro, FilePen, FileText, Image as ImageIcon, Info, ListChecks, NotebookText, PlusCircle, Save, Soup, Trash2, Utensils, X, Star, CheckCircle2, Shield, CircleX, BookCopy, Sparkles, ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateRecipeDetails, addRecipePreparationLink, deleteRecipePreparationLink, updateRecipePreparationLink, replaceRecipeIngredients, replaceRecipePreparations } from "@/app/(app)/menu/actions";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { ImageUploadDialog } from "@/app/(app)/menu/[id]/ImageUploadDialog";
import { generateRecipe } from "@/ai/flows/suggestion-flow";
import { IngredientModal } from "../../ingredients/IngredientModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

type RecipeDetailClientProps = {
  recipeId: string;
};

type FullRecipeIngredient = {
    id: string; // Ingredient ID
    recipeIngredientId: string; // The ID of the document in recipeIngredients collection
    name: string;
    quantity: number;
    unit: string;
    totalCost: number;
};

type NewRecipeIngredient = {
    tempId: string; // Temporary client-side ID
    ingredientId?: string; // Linked ingredient ID from DB
    name: string; // Name suggested by AI or entered by user
    quantity: number;
    unit: string;
    totalCost: number;
};

type FullRecipePreparation = {
    id: string; // The link document ID
    childPreparationId: string;
    name: string;
    quantity: number;
    unit: string;
    totalCost: number;
    _costPerUnit?: number;
    _productionUnit: string;
}

type NewRecipePreparation = {
    id: string; // Temporary client-side ID
    childPreparationId: string;
    name: string;
    quantity: number;
    unit: string;
    totalCost: number;
    _costPerUnit?: number; // Internal: to recalculate cost
    _productionUnit: string;
};

const getConversionFactor = (fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit || fromUnit.toLowerCase().trim() === toUnit.toLowerCase().trim()) return 1;

    const u = (unit: string) => unit.toLowerCase().trim();
    const factors: Record<string, number> = {
        'kg': 1000, 'g': 1, 'mg': 0.001,
        'l': 1000, 'ml': 1,
        'litre': 1000, 'litres': 1000,
        // For unit-based items, conversion factor is 1 if units match
        'pièce': 1, 'piece': 1, 'botte': 1,
    };
    
    const fromFactor = factors[u(fromUnit)];
    const toFactor = factors[u(toUnit)];

    // Handle weight-to-volume and vice-versa as a simple 1-to-1 conversion if units are not compatible
    if (fromFactor !== undefined && toFactor !== undefined) {
        // If one is weight and other is volume, and not a direct g/ml conversion
        const weightUnits = ['kg', 'g', 'mg'];
        const volumeUnits = ['l', 'ml', 'litre', 'litres'];
        const unitUnits = ['pièce', 'piece', 'botte'];

        const fromType = weightUnits.includes(u(fromUnit)) ? 'weight' : volumeUnits.includes(u(fromUnit)) ? 'volume' : 'unit';
        const toType = weightUnits.includes(u(toUnit)) ? 'weight' : volumeUnits.includes(u(toUnit)) ? 'volume' : 'unit';

        if (fromType === toType) {
            return fromFactor / toFactor;
        }
    }
    
    // If units are incompatible (e.g. 'kg' to 'pièce'), return 1 and log a warning.
    console.warn(`Incompatible unit conversion from '${fromUnit}' to '${toUnit}'. Defaulting to 1.`);
    return 1;
};

const recomputeIngredientCost = (ingredientLink: {quantity: number, unit: string}, ingredientData: Ingredient): number => {
    if (!ingredientData?.purchasePrice) return 0;
    
    const isUnitBased = ['pièce', 'piece', 'botte'].includes(ingredientData.purchaseUnit.toLowerCase());

    if (isUnitBased) {
        const costPerPiece = ingredientData.purchasePrice; // Assuming purchasePrice is per piece/botte
        const conversionFactor = getConversionFactor(ingredientLink.unit, ingredientData.purchaseUnit);
        return ingredientLink.quantity * costPerPiece * conversionFactor;
    }

    // --- Weight/Volume based calculation ---
    if (!ingredientData.purchaseWeightGrams) return 0;
    
    const costPerGramOrMl = ingredientData.purchasePrice / ingredientData.purchaseWeightGrams;
    const netCostPerGramOrMl = costPerGramOrMl / ((ingredientData.yieldPercentage || 100) / 100);

    const isLiquid = ['l', 'ml', 'litres'].includes(ingredientData.purchaseUnit.toLowerCase());
    const targetUnit = isLiquid ? 'ml' : 'g';
    
    const quantityInBaseUnit = ingredientLink.quantity * getConversionFactor(ingredientLink.unit, targetUnit);
    
    return quantityInBaseUnit * netCostPerGramOrMl;
};


const foodCostIndicators = [
  { range: "< 25%", level: "Exceptionnel", description: "Performance rare. Maîtrise parfaite ou prix très élevés.", color: "text-green-500" },
  { range: "25-30%", level: "Excellent", description: "Performance optimale. Très bonne maîtrise des coûts.", color: "text-emerald-500" },
  { range: "30-35%", level: "Bon", description: "Standard du secteur.", color: "text-yellow-500" },
  { range: "35-40%", level: "Moyen", description: "Acceptable mais perfectible. Surveillance requise.", color: "text-orange-500" },
  { range: "> 40%", level: "Mauvais", description: "Gestion défaillante. Action corrective urgente.", color: "text-red-500" },
];

const MarkdownRenderer = ({ text }: { text: string | undefined }) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
                    {listItems.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="font-semibold mt-4 mb-2 text-lg">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('- ')) {
            listItems.push(trimmedLine.substring(2));
        } else if (trimmedLine === '') {
            flushList();
            elements.push(<br key={`br-${index}`} />);
        } else {
            flushList();
            elements.push(<p key={index} className="mb-2 last:mb-0">{trimmedLine}</p>);
        }
    });

    flushList(); // Flush any remaining list items

    return <div className="prose prose-sm max-w-none">{elements}</div>;
};


const NewIngredientRow = ({
    newIng,
    sortedIngredients,
    handleNewIngredientChange,
    openNewIngredientModal,
    handleRemoveNewIngredient
}: {
    newIng: NewRecipeIngredient;
    sortedIngredients: Ingredient[];
    handleNewIngredientChange: (tempId: string, field: keyof NewRecipeIngredient, value: any) => void;
    openNewIngredientModal: (tempId: string) => void;
    handleRemoveNewIngredient: (tempId: string) => void;
}) => {
    const [openCombobox, setOpenCombobox] = useState(false);

    return (
        <TableRow key={newIng.tempId}>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between"
                            >
                                {newIng.ingredientId
                                    ? sortedIngredients.find((ing) => ing.id === newIng.ingredientId)?.name
                                    : newIng.name || "Choisir..."}
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
                                                <CommandItem
                                                    key={ing.id}
                                                    value={ing.name}
                                                    onSelect={(currentValue) => {
                                                        const selected = sortedIngredients.find(i => i.name.toLowerCase() === currentValue.toLowerCase());
                                                        if (selected) {
                                                            handleNewIngredientChange(newIng.tempId, 'ingredientId', selected.id!);
                                                        }
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            newIng.ingredientId === ing.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {ing.name}
                                                </CommandItem>
                                                : null
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {!newIng.ingredientId && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openNewIngredientModal(newIng.tempId)} title={`Créer l'ingrédient "${newIng.name}"`}>
                            <PlusCircle className="h-4 w-4 text-primary" />
                        </Button>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <Input type="number" placeholder="Qté" className="w-20" value={newIng.quantity === 0 ? '' : newIng.quantity} onChange={(e) => handleNewIngredientChange(newIng.tempId, 'quantity', parseFloat(e.target.value) || 0)} />
            </TableCell>
            <TableCell>
                <Select value={newIng.unit} onValueChange={(value) => handleNewIngredientChange(newIng.tempId, 'unit', value)} >
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
            <TableCell className="text-right font-semibold">{(newIng.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveNewIngredient(newIng.tempId)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
        </TableRow>
    );
};


export default function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | Preparation | null>(null);
  const [editableRecipe, setEditableRecipe] = useState<Recipe | Preparation | null>(null);
  
  const [ingredients, setIngredients] = useState<FullRecipeIngredient[]>([]);
  const [editableIngredients, setEditableIngredients] = useState<FullRecipeIngredient[]>([]);
  
  const [preparations, setPreparations] = useState<FullRecipePreparation[]>([]);
  const [editablePreparations, setEditablePreparations] = useState<FullRecipePreparation[]>([]);
  const [newPreparations, setNewPreparations] = useState<NewRecipePreparation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  
  const [newIngredients, setNewIngredients] = useState<NewRecipeIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allPreparations, setAllPreparations] = useState<Preparation[]>([]);
  const [preparationsCosts, setPreparationsCosts] = useState<Record<string, number>>({});

  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);
  const [newIngredientDefaults, setNewIngredientDefaults] = useState<Partial<Ingredient> | null>(null);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const calculatePreparationsCosts = useCallback(async (preparationsList: Preparation[], ingredientsList: Ingredient[]): Promise<Record<string, number>> => {
    const costs: Record<string, number> = {};
    const prepDependencies: Record<string, string[]> = {};
    const prepOrder: string[] = [];
    const visited: Record<string, 'visiting' | 'visited'> = {};

    for (const prep of preparationsList) {
        if (!prep.id) continue;
        const linksQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", prep.id));
        const linksSnap = await getDocs(linksQuery);
        prepDependencies[prep.id] = linksSnap.docs.map(d => (d.data() as RecipePreparationLink).childPreparationId);
    }
    
    function visit(prepId: string) {
        if (!prepId || !preparationsList.find(p => p.id === prepId)) { return; }
        if (visited[prepId] === 'visited') return;
        if (visited[prepId] === 'visiting') { console.error("Circular dependency detected involving preparation ID:", prepId); return; }
        visited[prepId] = 'visiting';
        for (const depId of prepDependencies[prepId] || []) { visit(depId); }
        visited[prepId] = 'visited';
        prepOrder.push(prepId);
    }

    for (const prep of preparationsList) { if (prep.id) visit(prep.id); }

    for (const prepId of prepOrder) {
        const prep = preparationsList.find(p => p.id === prepId);
        if (!prep) continue;

        let totalCost = 0;
        const ingredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", prep.id));
        const ingredientsSnap = await getDocs(ingredientsQuery);
        for (const ingDoc of ingredientsSnap.docs) {
            const ingLink = ingDoc.data() as RecipeIngredientLink;
            const ingData = ingredientsList.find(i => i.id === ingLink.ingredientId);
            if (ingData) {
                totalCost += recomputeIngredientCost(ingLink, ingData);
            }
        }

        for (const depId of prepDependencies[prepId] || []) {
            const depLinkQuery = query(collection(db, "recipePreparationLinks"), where("parentRecipeId", "==", prepId), where("childPreparationId", "==", depId));
            const depLinkSnap = await getDocs(depLinkQuery);
            if (!depLinkSnap.empty) {
                const linkData = depLinkSnap.docs[0].data() as RecipePreparationLink;
                const childPrep = preparationsList.find(p => p.id === depId);
                const childCostPerProductionUnit = costs[depId];
                if (childPrep && childCostPerProductionUnit !== undefined) {
                     const conversionFactor = getConversionFactor(childPrep.productionUnit, linkData.unitUse);
                     const costPerUseUnit = childCostPerProductionUnit / conversionFactor;
                     totalCost += (linkData.quantity || 0) * costPerUseUnit;
                }
            }
        }
        
        costs[prepId] = (totalCost / (prep.productionQuantity || 1)) || 0;
    }

    return costs;
  }, []);

  const fetchAllIngredients = useCallback(async () => {
    const allIngredientsSnap = await getDocs(query(collection(db, "ingredients")));
    const ingredientsList = allIngredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
    setAllIngredients(ingredientsList);
    return ingredientsList;
  }, []);

  const fullDataRefresh = useCallback(async () => {
    const ingredientsList = await fetchAllIngredients();
    const allPrepsSnap = await getDocs(query(collection(db, "preparations")));
    const allPrepsData = allPrepsSnap.docs.map(doc => ({...doc.data(), id: doc.id} as Preparation));
    setAllPreparations(allPrepsData);
    const costs = await calculatePreparationsCosts(allPrepsData, ingredientsList);
    setPreparationsCosts(costs);
    
    const collectionName = "preparations"; // This is the preparations detail page
    const recipeDocRef = doc(db, collectionName, recipeId);
    const recipeSnap = await getDoc(recipeDocRef);

    if (!recipeSnap.exists()) {
        setError("Fiche technique non trouvée.");
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
            return { id: ingredientData.id!, recipeIngredientId: docSnap.id, name: ingredientData.name, quantity: recipeIngredientData.quantity, unit: recipeIngredientData.unitUse, totalCost };
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
             const conversionFactor = getConversionFactor(childRecipeData.productionUnit, linkData.unitUse);
             const costPerUseUnit = costPerProductionUnit / conversionFactor;
            return { id: linkDoc.id, childPreparationId: linkData.childPreparationId, name: childRecipeData.name, quantity: linkData.quantity, unit: linkData.unitUse, totalCost: costPerUseUnit * (linkData.quantity || 0), _costPerUnit: costPerProductionUnit, _productionUnit: childRecipeData.productionUnit };
        }
        return null;
    }).filter(Boolean) as FullRecipePreparation[];
    setPreparations(preparationsData);
    setEditablePreparations(JSON.parse(JSON.stringify(preparationsData)));

}, [recipeId, calculatePreparationsCosts, fetchAllIngredients]);

  useEffect(() => {
    if (!recipeId) { setIsLoading(false); setError("L'identifiant de la recette est manquante."); return; }
    if (!isFirebaseConfigured) { setError("La configuration de Firebase est manquante."); setIsLoading(false); return; }
    
    let isMounted = true;
    
    const initialLoad = async () => {
        try {
            setIsLoading(true);
            await fullDataRefresh();
        } catch(e: any) {
             console.error("Error during initial load: ", e);
            if (isMounted) { setError("Impossible de charger les données de support. " + e.message); }
        } finally {
            if(isMounted) setIsLoading(false);
        }
    }

    initialLoad();

    return () => { isMounted = false; };
  }, [recipeId, fullDataRefresh]);

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
    if (editableRecipe) { setEditableRecipe({ ...editableRecipe, [field]: value }); }
  };
  
  const handleIngredientChange = (recipeIngredientId: string, field: 'quantity' | 'unit', value: any) => {
      setEditableIngredients(current => current.map(ing => {
          if (ing.recipeIngredientId === recipeIngredientId) {
              const updatedIng = { ...ing, [field]: value };
              const ingData = allIngredients.find(i => i.id === ing.id);
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
  
  const handleRemoveNewIngredient = (tempId: string) => { setNewIngredients(current => current.filter(ing => ing.tempId !== tempId)); };
  const handleRemoveExistingIngredient = (recipeIngredientId: string) => { setEditableIngredients(current => current.filter(ing => ing.recipeIngredientId !== recipeIngredientId)); };
  const handleCreateAndLinkIngredient = (tempId: string, newIngredient: Ingredient) => {
      fetchAllIngredients().then(updatedList => {
          const newlyAdded = updatedList.find(i => i.id === newIngredient.id);
          if (newlyAdded) {
              handleNewIngredientChange(tempId, 'ingredientId', newlyAdded.id!);
          }
      });
  }
  const openNewIngredientModal = (tempId: string) => { const ingredientToCreate = newIngredients.find(ing => ing.tempId === tempId); if(ingredientToCreate) { setCurrentTempId(tempId); setNewIngredientDefaults({ name: ingredientToCreate.name }); setIsNewIngredientModalOpen(true); } }

  const handleAddNewPreparation = () => { setNewPreparations([ ...newPreparations, { id: `new-prep-${Date.now()}`, childPreparationId: '', name: '', quantity: 0, unit: '', totalCost: 0, _productionUnit: '', }, ]); };
  const handleRemoveNewPreparation = (tempId: string) => { setNewPreparations(current => current.filter(p => p.id !== tempId)); };
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
              if (p.id === tempId) {
                  const updatedPrep = { ...p, [field]: value };
                  if (field === 'childPreparationId') {
                      const selectedPrep = allPreparations.find(prep => prep.id === value);
                      if (selectedPrep) { updatedPrep.name = selectedPrep.name; updatedPrep.unit = selectedPrep.usageUnit || selectedPrep.productionUnit || 'g'; updatedPrep._costPerUnit = preparationsCosts[selectedPrep.id!] || 0; updatedPrep._productionUnit = selectedPrep.productionUnit || ''; }
                  }
                  if (field === 'quantity' || field === 'childPreparationId') {
                      const costPerProductionUnit = updatedPrep._costPerUnit || 0;
                      const conversionFactor = getConversionFactor(updatedPrep.unit, updatedPrep.productionUnit);
                      const costPerUseUnit = costPerProductionUnit / conversionFactor;
                      updatedPrep.totalCost = (updatedPrep.quantity || 0) * costPerUseUnit;
                  }
                  return updatedPrep;
              }
              return p;
          })
      );
  };
  const handleRemoveExistingPreparation = (preparationLinkId: string) => { 
    setEditablePreparations(current => current.filter(p => p.id !== preparationLinkId));
    toast({ title: "Sous-recette retirée", description: "La modification sera appliquée à la sauvegarde.", }); 
  };

  const handleSave = async () => {
    if (!editableRecipe) return;
    setIsSaving(true);
    try {
        const recipeDataToSave = {
            name: editableRecipe.name, description: editableRecipe.description, difficulty: editableRecipe.difficulty, duration: editableRecipe.duration, procedure_preparation: editableRecipe.procedure_preparation, procedure_cuisson: editableRecipe.procedure_cuisson, procedure_service: editableRecipe.procedure_service,
            productionQuantity: (editableRecipe as Preparation).productionQuantity,
            productionUnit: (editableRecipe as Preparation).productionUnit,
            usageUnit: (editableRecipe as Preparation).usageUnit,
        };
        await updateRecipeDetails(recipeId, recipeDataToSave, 'Préparation');
        
        const allCurrentIngredients = [ ...editableIngredients.map(ing => ({ ingredientId: ing.id, quantity: ing.quantity, unitUse: ing.unit })), ...newIngredients.map(ing => ({ ingredientId: ing.ingredientId, quantity: ing.quantity, unitUse: ing.unit }))].filter(ing => ing.ingredientId && ing.quantity > 0) as Omit<RecipeIngredientLink, 'id' | 'recipeId'>[];
        await replaceRecipeIngredients(recipeId, allCurrentIngredients);
        
        const existingPrepLinks = editablePreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit }));
        const newPrepLinks = newPreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit })).filter(p => p.childPreparationId);
        const allPrepLinks = [...existingPrepLinks, ...newPrepLinks] as Omit<RecipePreparationLink, 'id'>[];
        await replaceRecipePreparations(recipeId, allPrepLinks);
        
        await fullDataRefresh();

        toast({ title: "Succès", description: "Les modifications ont été sauvegardées." });
        setIsEditing(false); setNewIngredients([]); setNewPreparations([]);
    } catch (error) { console.error("Error saving changes:", error); toast({ title: "Erreur", description: "La sauvegarde des modifications a échoué.", variant: "destructive", });
    } finally { setIsSaving(false); }
  };

  const handleGenerateRecipe = async () => {
    if (!recipe) return;
    setIsGenerating(true);
    try {
      const result = await generateRecipe({ name: recipe.name, description: recipe.description, type: recipe.type, });
      if (result) {
        if (!isEditing) { setIsEditing(true); }
        setEditableIngredients([]); setNewIngredients([]);
        setEditableRecipe(current => {
            if (!current) return null;
            const updated = { ...current,
                 procedure_preparation: result.procedure_preparation, 
                 procedure_cuisson: result.procedure_cuisson, 
                 procedure_service: result.procedure_service, 
                 difficulty: result.difficulty, 
                 duration: result.duration, 
            };
            if (updated.type === 'Préparation') { 
                (updated as Preparation).productionQuantity = result.productionQuantity; 
                (updated as Preparation).productionUnit = result.productionUnit; 
                (updated as Preparation).usageUnit = result.usageUnit;
            }
            return updated;
        });

        const generatedIngredients: NewRecipeIngredient[] = result.ingredients.map(ing => {
          const existingIngredient = allIngredients.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
          const tempId = `new-gen-${Date.now()}-${Math.random()}`;
          let totalCost = 0;
          if(existingIngredient) {
             const tempNewIng: {quantity: number, unit: string} = {quantity: ing.quantity, unit: ing.unit};
             totalCost = recomputeIngredientCost(tempNewIng, existingIngredient);
          }
          return { tempId, ingredientId: existingIngredient?.id, name: ing.name, quantity: ing.quantity, unit: ing.unit, totalCost: isNaN(totalCost) ? 0 : totalCost, };
        });
        setNewIngredients(generatedIngredients);
        toast({ title: "Recette générée !", description: "La fiche technique a été pré-remplie. Veuillez vérifier les informations." });
      }
    } catch (e) { console.error("Failed to generate recipe with AI", e); toast({ title: "Erreur de l'IA", description: "Impossible de générer la recette. Veuillez réessayer.", variant: 'destructive', });
    } finally { setIsGenerating(false); }
  };

  const sortedIngredients = useMemo(() => {
    return [...allIngredients].sort((a, b) => a.name.localeCompare(b.name));
  }, [allIngredients]);

  const currentRecipeData = isEditing ? editableRecipe : recipe;
  const currentIngredientsData = isEditing ? editableIngredients : ingredients;
  const currentPreparationsData = isEditing ? editablePreparations : preparations;
  
  const { totalRecipeCost, costPerPortion, } = useMemo(() => {
    if (!currentRecipeData) { return { totalRecipeCost: 0, costPerPortion: 0 }; }
    const ingredientsCost = (isEditing ? editableIngredients : ingredients).reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const newIngredientsCost = newIngredients.reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const preparationsCost = (isEditing ? editablePreparations : preparations).reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const newPreparationsCost = newPreparations.reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const totalCost = ingredientsCost + newIngredientsCost + preparationsCost + newPreparationsCost;
    let costPerPortionValue = 0;
    if (currentRecipeData.type === 'Préparation') { const productionQuantity = (currentRecipeData as Preparation).productionQuantity || 1; costPerPortionValue = totalCost / productionQuantity;
    } else { const portions = (currentRecipeData as Recipe).portions || 1; costPerPortionValue = totalCost / portions; }
    return { totalRecipeCost: totalCost, costPerPortion: costPerPortionValue };
  }, [currentRecipeData, ingredients, editableIngredients, newIngredients, preparations, editablePreparations, newPreparations, isEditing]);


  if (isLoading) { return <RecipeDetailSkeleton />; }
  if (error) { return ( <div className="container mx-auto py-10"><Alert variant="destructive" className="max-w-2xl mx-auto my-10"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div> ); }
  if (!recipe || !currentRecipeData) { return ( <div className="container mx-auto py-10 text-center"><p>Fiche technique non trouvée ou erreur de chargement.</p></div> ); }
  
  const isPlat = currentRecipeData.type === 'Plat';

  return (
    <div className="space-y-4">
      {isNewIngredientModalOpen && (<IngredientModal open={isNewIngredientModalOpen} onOpenChange={setIsNewIngredientModalOpen} ingredient={newIngredientDefaults} onSuccess={(newDbIngredient) => { if (newDbIngredient && currentTempId) { handleCreateAndLinkIngredient(currentTempId, newDbIngredient); } }}><div/></IngredientModal>)}

      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-grow">
            <div className="bg-primary/10 text-primary rounded-lg h-14 w-14 flex items-center justify-center shrink-0">
                <NotebookText className="h-7 w-7" />
            </div>
            <div className="w-full">
                 {isEditing ? (
                    <Input
                        value={editableRecipe?.name}
                        onChange={(e) => handleRecipeDataChange('name', e.target.value)}
                        className="text-2xl font-bold tracking-tight h-12 w-full"
                    />
                ) : (
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">{recipe.name}</h1>
                )}
                <p className="text-muted-foreground">Préparation</p>
                 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {recipe.duration} min</div>
                    <div className="flex items-center gap-1.5"><Soup className="h-4 w-4" /> {recipe.difficulty}</div>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handleGenerateRecipe} disabled={isGenerating || isEditing}><Sparkles className="mr-2 h-4 w-4" />{isGenerating ? 'Génération...' : 'Élaborer avec l\'IA'}</Button>
            <Button variant="outline" onClick={handleToggleEditMode}>{isEditing ? <><X className="mr-2 h-4 w-4"/>Annuler</> : <><FilePen className="mr-2 h-4 w-4"/>Modifier</>}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader><CardTitle className="flex items-center justify-between"><div className="flex items-center gap-2"><Utensils className="h-5 w-5"/>Ingrédients</div>{isEditing && <Button variant="outline" size="sm" onClick={() => setNewIngredients([...newIngredients, { tempId: `new-manual-${Date.now()}`, name: '', quantity: 0, unit: 'g', totalCost: 0 }])}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter Ingrédient</Button>}</CardTitle><CardDescription>Liste des matières premières nécessaires pour la recette.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[35%]">Ingrédient</TableHead><TableHead>Quantité</TableHead><TableHead>Unité</TableHead><TableHead className="text-right">Coût</TableHead>{isEditing && <TableHead className="w-[50px]"></TableHead>}</TableRow></TableHeader>
                        <TableBody>
                            {isEditing && editableIngredients.map(ing => (
                                <TableRow key={ing.recipeIngredientId}><TableCell className="font-medium">{ing.name}</TableCell><TableCell><Input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(ing.recipeIngredientId, 'quantity', parseFloat(e.target.value) || 0)} className="w-20"/></TableCell><TableCell><Select value={ing.unit} onValueChange={(value) => handleIngredientChange(ing.recipeIngredientId, 'unit', value)} ><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="l">l</SelectItem><SelectItem value="pièce">pièce</SelectItem></SelectContent></Select></TableCell><TableCell className="text-right font-semibold">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell><TableCell><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Retirer l'ingrédient ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir retirer "{ing.name}" de cette recette ? Cette action prendra effet à la sauvegarde.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExistingIngredient(ing.recipeIngredientId)}>Retirer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>
                            ))}
                            {!isEditing && ingredients.map(ing => ( <TableRow key={ing.recipeIngredientId}><TableCell className="font-medium">{ing.name}</TableCell><TableCell>{ing.quantity}</TableCell><TableCell>{ing.unit}</TableCell><TableCell className="text-right font-semibold">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell></TableRow>))}
                            {isEditing && newIngredients.map((newIng) => (
                                <NewIngredientRow
                                    key={newIng.tempId}
                                    newIng={newIng}
                                    sortedIngredients={sortedIngredients}
                                    handleNewIngredientChange={handleNewIngredientChange}
                                    openNewIngredientModal={openNewIngredientModal}
                                    handleRemoveNewIngredient={handleRemoveNewIngredient}
                                />
                            ))}
                            {currentIngredientsData.length === 0 && newIngredients.length === 0 && !isEditing && (<TableRow><TableCell colSpan={isEditing ? 5: 4} className="text-center h-24">Aucun ingrédient lié.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center justify-between"><div className="flex items-center gap-2"><BookCopy className="h-5 w-5"/>Sous-Recettes</div>{isEditing && <Button variant="outline" size="sm" onClick={handleAddNewPreparation}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter Préparation</Button>}</CardTitle><CardDescription>Liste des préparations utilisées dans cette recette.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-1/3">Préparation</TableHead><TableHead>Quantité</TableHead><TableHead>Unité</TableHead><TableHead className="text-right">Coût</TableHead>{isEditing && <TableHead className="w-[50px]"></TableHead>}</TableRow></TableHeader>
                        <TableBody>
                            {isEditing && editablePreparations.map(prep => (
                                <TableRow key={prep.id}><TableCell className="font-medium">{prep.name}</TableCell><TableCell>{isEditing ? ( <Input type="number" value={prep.quantity} onChange={(e) => handlePreparationChange(prep.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20" /> ) : prep.quantity }</TableCell><TableCell>{prep.unit}</TableCell><TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell>{isEditing && ( <TableCell><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Retirer la préparation ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir retirer "{prep.name}" de cette recette ?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExistingPreparation(prep.id)}>Retirer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell> )}</TableRow>
                            ))}
                            {!isEditing && preparations.map(prep => (
                                <TableRow key={prep.id}><TableCell className="font-medium">{prep.name}</TableCell><TableCell>{prep.quantity}</TableCell><TableCell>{prep.unit}</TableCell><TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell></TableRow>
                            ))}
                            {isEditing && newPreparations.map((prep) => (
                                <TableRow key={prep.id}><TableCell><Select value={prep.childPreparationId} onValueChange={(value) => handleNewPreparationChange(prep.id, 'childPreparationId', value)} ><SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger><SelectContent>{allPreparations.map(p => ( p.id && p.id !== recipeId ? <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem> : null ))}</SelectContent></Select></TableCell><TableCell><Input type="number" placeholder="Qté" className="w-20" value={prep.quantity === 0 ? '' : prep.quantity} onChange={(e) => handleNewPreparationChange(prep.id, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell><TableCell>{prep.unit || "-"}</TableCell><TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveNewPreparation(prep.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></TableCell></TableRow>
                            ))}
                            {currentPreparationsData.length === 0 && newPreparations.length === 0 && (<TableRow><TableCell colSpan={isEditing ? 5 : 4} className="text-center h-24 text-muted-foreground">Aucune sous-recette ajoutée.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Procédure</CardTitle></CardHeader>
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
                                <TabsTrigger value="service">Service</TabsTrigger>
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
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-muted-foreground">Coût Total Matières</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-right">{totalRecipeCost.toFixed(2)} DZD</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Production & Coût</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="productionQuantity">Cette recette produit</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="productionQuantity" type="number" value={(editableRecipe as Preparation)?.productionQuantity || 1} onChange={(e) => handleRecipeDataChange('productionQuantity', parseFloat(e.target.value) || 1)} className="w-1/2" />
                                    <Input id="productionUnit" type="text" value={(editableRecipe as Preparation)?.productionUnit || ''} onChange={(e) => handleRecipeDataChange('productionUnit', e.target.value)} placeholder="Unité (ex: kg, L)" className="w-1/2"/>
                                </div>
                            </div>
                                <div className="space-y-2">
                                <Label htmlFor="usageUnit">Unité d'utilisation suggérée</Label>
                                <Input id="usageUnit" type="text" value={(editableRecipe as Preparation)?.usageUnit || ''} onChange={(e) => handleRecipeDataChange('usageUnit', e.target.value)} placeholder="Unité pour les recettes (ex: g, ml)" />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Production totale</span>
                                <span className="font-semibold">{currentRecipeData.productionQuantity} {currentRecipeData.productionUnit}</span>
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
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {isEditing && (<div className="fixed bottom-6 right-6 z-50"><Card className="p-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg"><Button onClick={handleSave} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? "Sauvegarde..." : `Sauvegarder les modifications`}</Button></Card></div>)}
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

    
