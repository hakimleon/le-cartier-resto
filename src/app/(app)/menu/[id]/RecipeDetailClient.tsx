
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, RecipeIngredientLink, Ingredient, RecipePreparationLink, Preparation, GeneratedIngredient, FullRecipeIngredient } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Beef, ChefHat, Drumstick, Clock, Euro, FilePen, Fish, FileText, Image as ImageIcon, Info, Lightbulb, ListChecks, NotebookText, PlusCircle, Save, Soup, Trash2, Utensils, X, Star, CheckCircle2, Shield, CircleX, BookCopy, Sparkles, ChevronsUpDown, Check, PercentCircle, FishSymbol, Printer } from "lucide-react";
import Image from "next/image";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { replaceRecipeIngredients, updateRecipeDetails, addRecipePreparationLink, deleteRecipePreparationLink, updateRecipePreparationLink, replaceRecipePreparations } from "../actions";
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
import { ImageUploadDialog } from "./ImageUploadDialog";
import { generateCommercialArgument } from "@/ai/flows/suggestion-flow";
import { IngredientModal } from "../../ingredients/IngredientModal";
import { RecipeConceptOutput } from "@/ai/flows/workshop-flow";
import { PreparationModal } from "../../preparations/PreparationModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { PrintLink } from '@/components/pdf/PrintLink';


const WORKSHOP_CONCEPT_KEY = 'workshopGeneratedConcept';

type RecipeDetailClientProps = {
    recipeId: string;
};

type NewRecipeIngredient = {
    tempId: string; // Temporary client-side ID
    ingredientId?: string; // Linked ingredient ID from DB
    name: string; // Name suggested by AI or entered by user
    quantity: number;
    unit: string;
    category: string;
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
    tempId: string; // Temporary client-side ID
    childPreparationId?: string;
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
    
    // Fallback if no direct conversion is possible
    return 1;
};

const recomputeIngredientCost = (ingredientLink: {quantity: number, unit: string}, ingredientData: Ingredient): number => {
    if (!ingredientData?.purchasePrice || !ingredientData?.purchaseWeightGrams) {
        return 0;
    }

    const costPerGramOrMl = ingredientData.purchasePrice / ingredientData.purchaseWeightGrams;
    const netCostPerGramOrMl = costPerGramOrMl / ((ingredientData.yieldPercentage || 100) / 100);

    const isLiquidPurchase = ['l', 'ml', 'litres'].includes(ingredientData.purchaseUnit.toLowerCase());
    // Determine target unit based on purchase unit type (weight vs volume), not usage unit.
    const targetUnit = isLiquidPurchase ? 'ml' : 'g';
    
    const quantityInBaseUnit = ingredientLink.quantity * getConversionFactor(ingredientLink.unit, targetUnit);
    
    const finalCost = quantityInBaseUnit * netCostPerGramOrMl;
    return isNaN(finalCost) ? 0 : finalCost;
};



const GAUGE_LEVELS = {
    exceptionnel: { icon: Star },
    excellent: { icon: CheckCircle2 },
    bon: { icon: Shield },
    moyen: { icon: AlertTriangle },
    mauvais: { icon: CircleX },
};

const foodCostIndicators = [
    { range: "< 25%", level: "Exceptionnel", description: "Performance rare. Maîtrise parfaite ou prix très élevés.", color: "text-green-500", icon: GAUGE_LEVELS.exceptionnel.icon },
    { range: "25-30%", level: "Excellent", description: "Performance optimale. Très bonne maîtrise des coûts.", color: "text-emerald-500", icon: GAUGE_LEVELS.excellent.icon },
    { range: "30-35%", level: "Bon", description: "Performance correcte. Standard du secteur.", color: "text-yellow-500", icon: GAUGE_LEVELS.bon.icon },
    { range: "35-40%", level: "Moyen", description: "Acceptable mais perfectible. Surveillance requise.", color: "text-orange-500", icon: GAUGE_LEVELS.moyen.icon },
    { range: "> 40%", level: "Mauvais", description: "Gestion défaillante. Action corrective urgente.", color: "text-red-500", icon: GAUGE_LEVELS.mauvais.icon },
];

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
            <TableCell><Select value={ing.unit} onValueChange={(value) => handleIngredientChange(ing.recipeIngredientId, 'unit', value)} ><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="l">l</SelectItem><SelectItem value="pièce">pièce</SelectItem></SelectContent></Select></TableCell>
            <TableCell className="text-right font-semibold">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Retirer l'ingrédient ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir retirer "{ing.name}" de cette recette ? Cette action prendra effet à la sauvegarde.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExistingIngredient(ing.recipeIngredientId)}>Retirer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell>
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
                            <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between">
                                {newIng.ingredientId ? sortedIngredients.find((ing) => ing.id === newIng.ingredientId)?.name : newIng.name || "Choisir..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Rechercher ou taper un nom..."
                                    value={newIng.name}
                                    onValueChange={(search) => {
                                        handleNewIngredientChange(newIng.tempId, 'name', search);
                                        handleNewIngredientChange(newIng.tempId, 'ingredientId', undefined);
                                    }}
                                />
                                <CommandList>
                                     <CommandEmpty>
                                        <Button variant="ghost" className="w-full justify-start" onClick={() => {
                                            setOpenCombobox(false);
                                            openNewIngredientModal(newIng.tempId);
                                        }}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Créer l'ingrédient "{newIng.name}"
                                        </Button>
                                    </CommandEmpty>
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
                </div>
            </TableCell>
            <TableCell><Input type="number" placeholder="Qté" className="w-20" value={newIng.quantity === 0 ? '' : newIng.quantity} onChange={(e) => handleNewIngredientChange(newIng.tempId, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell>
            <TableCell><Select value={newIng.unit} onValueChange={(value) => handleNewIngredientChange(newIng.tempId, 'unit', value)} ><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="l">l</SelectItem><SelectItem value="pièce">pièce</SelectItem></SelectContent></Select></TableCell>
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
             <TableCell>
                <Select value={prep.unit} onValueChange={(value) => handlePreparationChange(prep.id, 'unit', value)}>
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
            <TableCell>
                <Select value={prep.unit} onValueChange={(value) => handleNewPreparationChange(prep.tempId, 'unit', value)}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="Unité" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="pièce">pièce</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="text-right font-semibold">{(prep.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveNewPreparation(prep.tempId)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
        </TableRow>
    )
}

export default function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
    const [recipe, setRecipe] = useState<Recipe | Preparation | null>(null);
    const [editableRecipe, setEditableRecipe] = useState<Recipe | Preparation | null>(null);

    const [ingredients, setIngredients] = useState<FullRecipeIngredient[]>([]);
    const [editableIngredients, setEditableIngredients] = useState<FullRecipeIngredient[]>([]);

    const [preparations, setPreparations] = useState<FullRecipePreparation[]>([]);
    const [editablePreparations, setEditablePreparations] = useState<FullRecipePreparation[]>([]);

    const [newPreparations, setNewPreparations] = useState<NewRecipePreparation[]>([]);
    const [isNewPreparationModalOpen, setIsNewPreparationModalOpen] = useState(false);
    const [newPreparationDefaults, setNewPreparationDefaults] = useState<Partial<Preparation> | null>(null);
    const [currentPrepTempId, setCurrentPrepTempId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    const [newIngredients, setNewIngredients] = useState<NewRecipeIngredient[]>([]);
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [allPreparations, setAllPreparations] = useState<Preparation[]>([]);
    const [preparationsCosts, setPreparationsCosts] = useState<Record<string, number>>({});

    const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);
    const [newIngredientDefaults, setNewIngredientDefaults] = useState<Partial<Ingredient> | null>(null);
    const [currentTempId, setCurrentTempId] = useState<string | null>(null);
    const [workshopConcept, setWorkshopConcept] = useState<RecipeConceptOutput | null>(null);

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
                        const conversionFactor = getConversionFactor(childPrep.productionUnit || 'g', linkData.unitUse);
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

        const recipeDocRef = doc(db, "recipes", recipeId);
        const recipeSnap = await getDoc(recipeDocRef);

        if (!recipeSnap.exists()) {
            setError("Fiche technique non trouvée.");
            setRecipe(null);
            setIsLoading(false);
            return;
        }

        const fetchedRecipe = { ...recipeSnap.data(), id: recipeSnap.id } as Recipe;
        setRecipe(fetchedRecipe);
        setEditableRecipe(JSON.parse(JSON.stringify(fetchedRecipe)));

        const recipeIngredientsQuery = query(collection(db, "recipeIngredients"), where("recipeId", "==", recipeId));
        const recipeIngredientsSnap = await getDocs(recipeIngredientsQuery);
        const ingredientsData = recipeIngredientsSnap.docs.map(docSnap => {
            const recipeIngredientData = docSnap.data() as RecipeIngredientLink;
            const ingredientData = ingredientsList.find(i => i.id === recipeIngredientData.ingredientId);
            if (ingredientData) {
                const totalCost = recomputeIngredientCost(recipeIngredientData, ingredientData);

                return {
                    id: ingredientData.id!,
                    recipeIngredientId: docSnap.id,
                    name: ingredientData.name,
                    quantity: recipeIngredientData.quantity,
                    unit: recipeIngredientData.unitUse,
                    category: ingredientData.category,
                    totalCost: totalCost
                };
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
                const conversionFactor = getConversionFactor(childRecipeData.productionUnit || 'g', linkData.unitUse);
                const costPerUseUnit = costPerProductionUnit / conversionFactor;
                return { id: linkDoc.id, childPreparationId: linkData.childPreparationId, name: childRecipeData.name, quantity: linkData.quantity, unit: linkData.unitUse, totalCost: costPerUseUnit * (linkData.quantity || 0), _costPerUnit: costPerProductionUnit, _productionUnit: childRecipeData.productionUnit || 'g' };
            }
            return null;
        }).filter(Boolean) as FullRecipePreparation[];
        setPreparations(preparationsData);
        setEditablePreparations(JSON.parse(JSON.stringify(preparationsData)));

    }, [recipeId, fetchAllIngredients, fetchAllPreparations, calculatePreparationsCosts]);


    useEffect(() => {
        if (!recipeId) { setIsLoading(false); setError("L'identifiant de la recette est manquante."); return; }
        if (!isFirebaseConfigured) { setError("La configuration de Firebase est manquante."); setIsLoading(false); return; }

        let isMounted = true;

        const initialLoad = async () => {
            try {
                setIsLoading(true);
                await fullDataRefresh();
                const conceptJSON = sessionStorage.getItem(WORKSHOP_CONCEPT_KEY);
                if (conceptJSON && isMounted) {
                    setIsEditing(true);
                    const concept: RecipeConceptOutput = JSON.parse(conceptJSON);
                    setWorkshopConcept(concept); // <-- Store the raw concept

                    setEditableRecipe(current => {
                        if (!current) return null;
                        return {
                            ...current,
                            ...concept
                        };
                    });

                    const ingredientsList = await fetchAllIngredients();
                    processSuggestedIngredients(concept.ingredients, ingredientsList);

                    const allPrepsData = await fetchAllPreparations();
                    processSuggestedPreparations(concept.subRecipes, allPrepsData);

                    toast({ title: "Fiche technique importée !", description: "Vérifiez les informations et les liaisons suggérées." });
                    sessionStorage.removeItem(WORKSHOP_CONCEPT_KEY);
                }
            } catch (e: any) {
                console.error("Error during initial load: ", e);
                if (isMounted) { setError("Impossible de charger les données de support. " + e.message); }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        initialLoad();

        return () => { isMounted = false; };
    }, [recipeId, fullDataRefresh, fetchAllIngredients, fetchAllPreparations]);


    const processSuggestedIngredients = (suggested: GeneratedIngredient[], currentAllIngredients: Ingredient[]) => {
        const newIngs: NewRecipeIngredient[] = suggested.map(sugIng => {
            const existing = currentAllIngredients.find(dbIng => dbIng.name.toLowerCase() === sugIng.name.toLowerCase());
            const tempId = 'new-ws-' + Date.now() + '-' + Math.random();
            let totalCost = 0;
            if (existing) {
                totalCost = recomputeIngredientCost({quantity: sugIng.quantity, unit: sugIng.unit}, existing);
            }
            return { tempId, ingredientId: existing?.id, name: existing?.name || sugIng.name, quantity: sugIng.quantity, unit: sugIng.unit, totalCost: isNaN(totalCost) ? 0 : totalCost, category: existing?.category || '' };
        });
        setNewIngredients(newIngs);
    };

    const processSuggestedPreparations = (suggested: {name: string, quantity: number, unit: string}[], currentAllPreps: Preparation[]) => {
        const newPreps: NewRecipePreparation[] = suggested.map(prep => {
            const existing = currentAllPreps.find(p => p.name.toLowerCase() === prep.name.toLowerCase());
            const tempId = `new-prep-ws-${Date.now()}-${Math.random()}`;
            return {
                tempId,
                childPreparationId: existing?.id,
                name: existing?.name || prep.name,
                quantity: prep.quantity || 1, 
                unit: prep.unit || existing?.usageUnit || existing?.productionUnit || 'g',
                totalCost: 0, 
                _costPerUnit: existing ? preparationsCosts[existing.id!] || 0 : 0,
                _productionUnit: existing?.productionUnit || '',
            };
        });
        setNewPreparations(prev => [...prev, ...newPreps]);
    }
    
    const handleToggleEditMode = () => {
        if (isEditing) {
            // Cancel edits
            setEditableRecipe(JSON.parse(JSON.stringify(recipe)));
            setEditableIngredients(JSON.parse(JSON.stringify(ingredients)));
            setEditablePreparations(JSON.parse(JSON.stringify(preparations)));
            setNewIngredients([]);
            setNewPreparations([]);
            setWorkshopConcept(null); // Clear the workshop concept when cancelling
        }
        setIsEditing(!isEditing);
    };

    const handleRecipeDataChange = (field: keyof Recipe | keyof Preparation, value: any) => {
        if (editableRecipe) { setEditableRecipe({ ...editableRecipe, [field]: value }); }
    };

    const handleIngredientChange = (recipeIngredientId: string, field: 'quantity' | 'unit' | 'id', value: any) => {
        setEditableIngredients(current => current.map(ing => {
            if (ing.recipeIngredientId === recipeIngredientId) {
                const updatedIng = { ...ing, [field]: value };

                if (field === 'id') {
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
                let updatedIng = { ...ing, [field]: value };
                
                if (field === 'ingredientId') {
                    const selectedIngredient = allIngredients.find(i => i.id === updatedIng.ingredientId);
                    if (selectedIngredient) {
                        updatedIng.name = selectedIngredient.name;
                        updatedIng.category = selectedIngredient.category;
                        updatedIng.totalCost = recomputeIngredientCost(updatedIng, selectedIngredient);
                    } else {
                        updatedIng.ingredientId = undefined; // unlink if not found
                        updatedIng.category = '';
                        updatedIng.totalCost = 0;
                    }
                } else if (field === 'quantity' || field === 'unit') {
                     const selectedIngredient = allIngredients.find(i => i.id === updatedIng.ingredientId);
                     if(selectedIngredient){
                         updatedIng.totalCost = recomputeIngredientCost(updatedIng, selectedIngredient);
                     }
                }
                return updatedIng;
            }
            return ing;
        }));
    };

    const handleRemoveNewIngredient = (tempId: string) => { setNewIngredients(current => current.filter(ing => ing.tempId !== tempId)); };
    const handleRemoveExistingIngredient = (recipeIngredientId: string) => { setEditableIngredients(current => current.filter(ing => ing.recipeIngredientId !== recipeIngredientId)); };
    
    const handleCreateAndLinkIngredient = (tempId: string, newIngredient: Ingredient) => {
        fetchAllIngredients().then(updatedList => {
            const newlyAdded = updatedList.find(i => i.id === newIngredient.id);
            if (newlyAdded) {
                 setNewIngredients(current => current.map(ing => {
                    if (ing.tempId === tempId) {
                        let updatedIng = {...ing, ingredientId: newlyAdded.id!, name: newlyAdded.name };
                        updatedIng.totalCost = recomputeIngredientCost(updatedIng, newlyAdded);
                        return updatedIng;
                    }
                    return ing;
                }));
            }
        });
    };

    const openNewIngredientModal = (tempId: string) => { const ingredientToCreate = newIngredients.find(ing => ing.tempId === tempId); if (ingredientToCreate) { setCurrentTempId(tempId); setNewIngredientDefaults({ name: ingredientToCreate.name }); setIsNewIngredientModalOpen(true); } }

    // --- PREPARATION HANDLERS ---
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
    
    const handlePreparationChange = (linkId: string, field: 'quantity' | 'unit', value: any) => {
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
                if (field === 'quantity' || field === 'childPreparationId' || field === 'unit') {
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
            const recipeDataToSave = {
                name: editableRecipe.name,
                description: editableRecipe.description,
                difficulty: editableRecipe.difficulty,
                duration: editableRecipe.duration,
                procedure_preparation: editableRecipe.procedure_preparation,
                procedure_cuisson: editableRecipe.procedure_cuisson,
                procedure_service: editableRecipe.procedure_service,
                imageUrl: editableRecipe.imageUrl,
                ...(editableRecipe.type === 'Plat' ? { portions: editableRecipe.portions, tvaRate: editableRecipe.tvaRate, price: editableRecipe.price, commercialArgument: editableRecipe.commercialArgument, status: editableRecipe.status, category: editableRecipe.category, } : { productionQuantity: (editableRecipe as Preparation).productionQuantity, productionUnit: (editableRecipe as Preparation).productionUnit, usageUnit: (editableRecipe as Preparation).usageUnit, })
            };
            await updateRecipeDetails(recipeId, recipeDataToSave, 'recipes');

            const allCurrentIngredients = [...editableIngredients.map(ing => ({ ingredientId: ing.id, quantity: ing.quantity, unitUse: ing.unit })), ...newIngredients.map(ing => ({ ingredientId: ing.ingredientId, quantity: ing.quantity, unitUse: ing.unit }))].filter(ing => ing.ingredientId && ing.quantity > 0) as Omit<RecipeIngredientLink, 'id' | 'recipeId'>[];
            await replaceRecipeIngredients(recipeId, allCurrentIngredients);

            const existingPrepLinks = editablePreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit }));
            const newPrepLinks = newPreparations.map(p => ({ parentRecipeId: recipeId, childPreparationId: p.childPreparationId, quantity: p.quantity, unitUse: p.unit })).filter(p => p.childPreparationId);
            const allPrepLinks = [...existingPrepLinks, ...newPrepLinks] as Omit<RecipePreparationLink, 'id'>[];
            await replaceRecipePreparations(recipeId, allPrepLinks);

            await fullDataRefresh();

            toast({ title: "Succès", description: "Les modifications ont été sauvegardées." });
            setIsEditing(false); setNewIngredients([]); setNewPreparations([]); setWorkshopConcept(null);
        } catch (error) { console.error("Error saving changes:", error); toast({ title: "Erreur", description: "La sauvegarde des modifications a échoué.", variant: "destructive", }); } finally { setIsSaving(false); }
    };

    const handleGenerateArgument = async () => {
        if (!editableRecipe || editableRecipe.type !== 'Plat') return;
        setIsGenerating(true);
        try {
            const ingredientsList = [...editableIngredients, ...newIngredients].map(i => i.name).filter(Boolean);
            const result = await generateCommercialArgument({ name: editableRecipe.name, description: editableRecipe.description, ingredients: ingredientsList, });
            if (result && result.argument) { handleRecipeDataChange('commercialArgument', result.argument); toast({ title: "Argumentaire généré !", description: "Le champ a été rempli avec la suggestion de l'IA." }); }
        } catch (e) {
            console.error("Failed to generate commercial argument", e); toast({ title: "Erreur de l'IA", description: "Impossible de générer l'argumentaire. Veuillez réessayer.", variant: 'destructive', });
        } finally { setIsGenerating(false); }
    };

    const sortedIngredients = useMemo(() => {
        return [...allIngredients].sort((a, b) => a.name.localeCompare(b.name));
    }, [allIngredients]);

    const currentRecipeData = isEditing ? editableRecipe : recipe;
    
    const {
        totalRecipeCost,
        costPerPortion,
        priceHT,
        grossMargin,
        grossMarginPercentage,
        foodCostPercentage,
        multiplierCoefficient,
        costsByCategory
    } = useMemo(() => {
        const result = {
            totalRecipeCost: 0, costPerPortion: 0, priceHT: 0, grossMargin: 0, grossMarginPercentage: 0, foodCostPercentage: 0, multiplierCoefficient: 0,
            costsByCategory: {} as Record<string, number>
        };

        if (!currentRecipeData) return result;
        
        const ingredientsToSum = isEditing ? [...editableIngredients, ...newIngredients] : ingredients;
        const prepsToSum = isEditing ? [...editablePreparations, ...newPreparations] : preparations;
        
        ingredientsToSum.forEach(item => {
            const category = item.category?.trim() || 'Non catégorisé';
            if (category) {
                if (!result.costsByCategory[category]) {
                    result.costsByCategory[category] = 0;
                }
                result.costsByCategory[category] += item.totalCost || 0;
            }
        });

        const preparationsCost = prepsToSum.reduce((acc, item) => acc + (item.totalCost || 0), 0);
        const ingredientsCost = Object.values(result.costsByCategory).reduce((acc, cost) => acc + cost, 0);
        const totalCost = ingredientsCost + preparationsCost;

        result.totalRecipeCost = totalCost;

        if (currentRecipeData.type === 'Préparation') {
            result.costPerPortion = totalCost / ((currentRecipeData as Preparation).productionQuantity || 1);
            return result;
        }

        const portions = currentRecipeData.portions || 1;
        const costPerPortionValue = portions > 0 ? totalCost / portions : 0;
        const tvaRate = currentRecipeData.tvaRate || 10;
        const price = currentRecipeData.price || 0;
        const priceHTValue = price / (1 + tvaRate / 100);

        result.costPerPortion = costPerPortionValue;
        result.priceHT = priceHTValue;
        result.grossMargin = priceHTValue > 0 ? priceHTValue - costPerPortionValue : 0;
        result.grossMarginPercentage = priceHTValue > 0 ? (result.grossMargin / priceHTValue) * 100 : 0;
        result.foodCostPercentage = priceHTValue > 0 ? (costPerPortionValue / priceHTValue) * 100 : 0;
        result.multiplierCoefficient = costPerPortionValue > 0 ? priceHTValue / costPerPortionValue : 0;

        return result;
    }, [isEditing, currentRecipeData, ingredients, editableIngredients, newIngredients, preparations, editablePreparations, newPreparations]);


    const proteinCostBreakdown = useMemo(() => {
        if (!currentRecipeData || !costsByCategory) return [];
        const portions = currentRecipeData.type === 'Plat' ? currentRecipeData.portions || 1 : 1;
        const proteinCategories = {
            "Viandes & Gibiers": { icon: Beef, color: "bg-red-500", totalCost: costsByCategory["Viandes & Gibiers"] || 0 },
            "Volaille": { icon: Drumstick, color: "bg-amber-500", totalCost: costsByCategory["Volaille"] || 0 },
            "Poissons": { icon: Fish, color: "bg-sky-500", totalCost: costsByCategory["Poissons"] || 0 },
            "Fruits de mer & Crustacés": { icon: FishSymbol, color: "bg-cyan-500", totalCost: costsByCategory["Fruits de mer & Crustacés"] || 0 },
        };
        
        return Object.entries(proteinCategories)
            .map(([name, data]) => ({ 
                name, 
                ...data,
                costPerPortion: data.totalCost / portions
            }))
            .filter(item => item.totalCost > 0)
            .sort((a,b) => b.totalCost - a.totalCost);

    }, [costsByCategory, currentRecipeData]);

    if (isLoading) { return <RecipeDetailSkeleton />; }
    if (error) { return (<div className="container mx-auto py-10"><Alert variant="destructive" className="max-w-2xl mx-auto my-10"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>); }
    if (!recipe || !currentRecipeData) { return (<div className="container mx-auto py-10 text-center"><p>Fiche technique non trouvée ou erreur de chargement.</p></div>); }

    const isPlat = currentRecipeData.type === 'Plat';

    return (
        <div className="space-y-4">
            <IngredientModal open={isNewIngredientModalOpen} onOpenChange={setIsNewIngredientModalOpen} ingredient={newIngredientDefaults} onSuccess={(newDbIngredient) => { if (newDbIngredient && currentTempId) { handleCreateAndLinkIngredient(currentTempId, newDbIngredient); } }} ><div /></IngredientModal>
            <PreparationModal open={isNewPreparationModalOpen} onOpenChange={setIsNewPreparationModalOpen} preparation={newPreparationDefaults} onSuccess={(newDbPrep) => { if (newDbPrep && currentPrepTempId) { handleCreateAndLinkPreparation(currentPrepTempId, newDbPrep); } }}><div /></PreparationModal>
            <ImageUploadDialog isOpen={isImageUploadOpen} onClose={() => setIsImageUploadOpen(false)} onUploadComplete={(url) => { handleRecipeDataChange('imageUrl', url); }} />
            {currentRecipeData.imageUrl && (
                <ImagePreviewModal
                    isOpen={isImagePreviewOpen}
                    onClose={() => setIsImagePreviewOpen(false)}
                    imageUrl={currentRecipeData.imageUrl}
                    imageAlt={currentRecipeData.name}
                />
            )}

            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4 flex-grow">
                    <div className="bg-primary/10 text-primary rounded-lg h-14 w-14 flex items-center justify-center shrink-0">
                        <ChefHat className="h-7 w-7" />
                    </div>
                    <div className="w-full">
                        {isEditing ? (
                            <Input
                                value={editableRecipe?.name || ''}
                                onChange={(e) => handleRecipeDataChange('name', e.target.value)}
                                className="text-2xl font-bold tracking-tight h-12 w-full"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">{recipe.name}</h1>
                        )}
                        <p className="text-muted-foreground">{isPlat ? (recipe as Recipe).category : 'Préparation'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {isPlat && <Badge variant={(recipe as Recipe).status === 'Actif' ? 'default' : 'secondary'} className={cn((recipe as Recipe).status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>{(recipe as Recipe).status}</Badge>}
                            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {recipe.duration} min</div>
                            <div className="flex items-center gap-1.5"><Soup className="h-4 w-4" /> {recipe.difficulty}</div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <PrintLink recipe={currentRecipeData} ingredients={isEditing ? [...editableIngredients, ...newIngredients] : ingredients} preparations={isEditing ? [...editablePreparations, ...newPreparations] : preparations} totalCost={totalRecipeCost} />
                    <Button variant="outline" onClick={handleToggleEditMode}>
                        {isEditing ? <><X className="mr-2 h-4 w-4" />Annuler</> : <><FilePen className="mr-2 h-4 w-4" />Modifier</>}
                    </Button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-8">
                    {isPlat && (
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className="relative w-full h-96 block group cursor-pointer"
                                    onClick={() => setIsImagePreviewOpen(true)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsImagePreviewOpen(true) }}
                                    aria-label="Agrandir l'image du plat"
                                >
                                    <Image 
                                      src={currentRecipeData.imageUrl || "https://placehold.co/800x600.png"} 
                                      alt={recipe.name}
                                      fill
                                      sizes="100vw"
                                      style={{ objectFit: "contain" }} 
                                      data-ai-hint="food image" 
                                      className="transition-transform duration-300 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white bg-black/50 px-4 py-2 rounded-md">Agrandir</p>
                                    </div>
                                    {isEditing && (
                                        <div className="absolute bottom-4 right-4 z-10">
                                            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setIsImageUploadOpen(true); }}><ImageIcon className="mr-2 h-4 w-4" />Changer la photo</Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isPlat && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Informations Financières</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-lg">
                                    <div><p className="text-sm text-muted-foreground">Vente TTC</p>{isEditing ? <Input type="number" value={(editableRecipe as Recipe)?.price || 0} onChange={(e) => handleRecipeDataChange('price', parseFloat(e.target.value) || 0)} className="font-bold text-lg text-center" /> : <p className="font-bold text-lg">{currentRecipeData.price ? currentRecipeData.price.toFixed(2) : 'N/A'} DZD</p>}</div>
                                    <div><p className="text-sm text-muted-foreground">Vente HT</p><p className="font-bold text-lg">{priceHT.toFixed(2)} DZD</p></div>
                                    <div><p className="text-sm text-muted-foreground">Portions</p>{isEditing ? <Input type="number" value={(editableRecipe as Recipe)?.portions || ''} onChange={(e) => handleRecipeDataChange('portions', parseInt(e.target.value) || 1)} className="font-bold text-lg text-center" /> : <p className="font-bold text-lg">{currentRecipeData.portions}</p>}</div>
                                </div>
                                <div className="space-y-2 text-sm border-t pt-4">
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Coût Matière / Portion</span><span className="font-semibold">{costPerPortion.toFixed(2)} DZD</span></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Coefficient</span><span className="font-semibold">x {multiplierCoefficient.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Marge Brute</span><span className="font-semibold">{grossMargin.toFixed(2)} DZD ({grossMarginPercentage.toFixed(0)}%)</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {isPlat && proteinCostBreakdown.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PercentCircle className="h-5 w-5" />Répartition des Coûts Protéines</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {proteinCostBreakdown.map(item => {
                                    const percentage = totalRecipeCost > 0 ? (item.totalCost / totalRecipeCost) * 100 : 0;
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.name} className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Icon className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="font-semibold">{item.costPerPortion.toFixed(2)} DZD / portion ({percentage.toFixed(0)}%)</span>
                                            </div>
                                            <Progress value={percentage} indicatorClassName={item.color} />
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}


                    <Card>
                        <CardHeader><CardTitle className="flex items-center justify-between"><div className="flex items-center gap-2"><Utensils className="h-5 w-5" />Ingrédients</div>{isEditing && <Button variant="outline" size="sm" onClick={() => setNewIngredients([...newIngredients, { tempId: `new-manual-${Date.now()}`, name: '', quantity: 0, unit: 'g', totalCost: 0, category: '' }])}><PlusCircle className="mr-2 h-4 w-4" />Ajouter Ingrédient</Button>}</CardTitle><CardDescription>Liste des matières premières nécessaires pour la recette.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[45%]">Ingrédient</TableHead><TableHead>Quantité</TableHead><TableHead>Unité</TableHead><TableHead className="text-right">Coût</TableHead>{isEditing && <TableHead className="w-[50px]"></TableHead>}</TableRow></TableHeader>
                                <TableBody>
                                    {isEditing && editableIngredients.map(ing => (
                                        <EditableIngredientRow
                                            key={ing.recipeIngredientId}
                                            ing={ing}
                                            handleIngredientChange={handleIngredientChange}
                                            handleRemoveExistingIngredient={handleRemoveExistingIngredient}
                                            sortedIngredients={sortedIngredients}
                                        />
                                    ))}
                                    {!isEditing && ingredients.map(ing => (
                                        <TableRow key={ing.recipeIngredientId}><TableCell className="font-medium">{ing.name}</TableCell><TableCell>{ing.quantity}</TableCell><TableCell>{ing.unit}</TableCell><TableCell className="text-right font-semibold">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell></TableRow>
                                    ))}
                                    {isEditing && newIngredients.map((newIng) => (
                                        <NewIngredientRow
                                            key={newIng.tempId}
                                            newIng={newIng}
                                            handleNewIngredientChange={handleNewIngredientChange}
                                            openNewIngredientModal={openNewIngredientModal}
                                            handleRemoveNewIngredient={handleRemoveNewIngredient}
                                            sortedIngredients={sortedIngredients}
                                        />
                                    ))}
                                    {ingredients.length === 0 && newIngredients.length === 0 && !isEditing && (<TableRow><TableCell colSpan={isEditing ? 5 : 4} className="text-center h-24">Aucun ingrédient lié.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                      <BookCopy className="h-5 w-5" />Sous-Recettes
                            </div>{isEditing && <Button variant="outline" size="sm" onClick={() => setNewPreparations([...newPreparations, {tempId: `new-manual-${Date.now()}`, name: '', quantity: 0, unit: 'g', totalCost: 0, _productionUnit: '' }])}><PlusCircle className="mr-2 h-4 w-4" />Ajouter Préparation</Button>}</CardTitle><CardDescription>Liste des préparations (fiches techniques internes) utilisées dans cette recette.</CardDescription></CardHeader>
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
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Procédure</CardTitle></CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <Tabs defaultValue="preparation">
                                    <TabsList><TabsTrigger value="preparation">Préparation</TabsTrigger><TabsTrigger value="cuisson">Cuisson</TabsTrigger><TabsTrigger value="service">Service</TabsTrigger></TabsList>
                                    <TabsContent value="preparation" className="pt-4"><Textarea value={editableRecipe?.procedure_preparation || ''} onChange={(e) => handleRecipeDataChange('procedure_preparation', e.target.value)} rows={8} /></TabsContent>
                                    <TabsContent value="cuisson" className="pt-4"><Textarea value={editableRecipe?.procedure_cuisson || ''} onChange={(e) => handleRecipeDataChange('procedure_cuisson', e.target.value)} rows={8} /></TabsContent>
                                    <TabsContent value="service" className="pt-4"><Textarea value={editableRecipe?.procedure_service || ''} onChange={(e) => handleRecipeDataChange('procedure_service', e.target.value)} rows={8} /></TabsContent>
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
                    {workshopConcept && isEditing && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-lg text-primary">
                                    <div className="flex items-center gap-2"><Lightbulb className="h-5 w-5" />Suggestion de l'Atelier</div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:text-primary" onClick={() => setWorkshopConcept(null)}><X className="h-4 w-4" /></Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-semibold mb-1">Ingrédients suggérés</h4>
                                    <ul className="list-disc pl-5 text-muted-foreground text-xs space-y-1">
                                        {workshopConcept.ingredients.map(ing => <li key={ing.name}>{ing.quantity} {ing.unit} {ing.name}</li>)}
                                    </ul>
                                </div>
                                {workshopConcept.subRecipes && workshopConcept.subRecipes.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-1">Sous-recettes existantes</h4>
                                    <ul className="list-disc pl-5 text-muted-foreground text-xs space-y-1">
                                        {workshopConcept.subRecipes.map(prep => <li key={prep.name}>{prep.name}</li>)}
                                    </ul>
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-muted-foreground">Coût Total Matières</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-right">{totalRecipeCost.toFixed(2)} DZD</div><p className="text-xs text-muted-foreground text-right mt-1">{isPlat ? "Coût par portion : " + costPerPortion.toFixed(2) + " DZD" : "Coût par " + ((recipe as Preparation).productionUnit || 'unité') + " : " + costPerPortion.toFixed(2) + " DZD"}</p></CardContent></Card>
                    {isPlat && (
                        <>
                            <Card><CardHeader><CardTitle className="text-xl text-muted-foreground">Food Cost (%)</CardTitle></CardHeader><CardContent className="flex items-center justify-center p-6"><GaugeChart value={foodCostPercentage} unit="%" /></CardContent></Card>
                            <Card><Accordion type="single" collapsible className="w-full"><AccordionItem value="item-1" className="border-b-0"><AccordionTrigger className="p-4 hover:no-underline"><div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground"><ListChecks className="h-5 w-5" />Indicateurs Food Cost</div></AccordionTrigger><AccordionContent className="px-4"><ul className="space-y-3 text-sm">{foodCostIndicators.map(indicator => { const Icon = indicator.icon; return (<li key={indicator.level} className="flex items-start gap-3"><Icon className={cn("h-5 w-5 shrink-0 mt-0.5", indicator.color)} /><div><span className="font-semibold">{indicator.range} - {indicator.level}</span>:<p className="text-muted-foreground text-xs">{indicator.description}</p></div></li>) })}</ul></AccordionContent></AccordionItem></Accordion></Card>
                            <Card><CardHeader><CardTitle className="flex items-center justify-between text-xl text-muted-foreground"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Allergènes</div>{isEditing && <Button variant="ghost" size="icon" className="h-8 w-8"><FilePen className="h-4 w-4" /></Button>}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{recipe.allergens && recipe.allergens.length > 0 ? recipe.allergens.map(allergen => <Badge key={allergen} variant="secondary">{allergen}</Badge>) : <p className="text-sm text-muted-foreground">Aucun allergène spécifié.</p>}</CardContent></Card>
                            <Card><CardHeader><CardTitle className="flex items-center justify-between text-xl text-muted-foreground"><div className="flex items-center gap-2">Argumentaire Commercial</div>{isEditing && (<Button variant="ghost" size="icon" onClick={handleGenerateArgument} disabled={isGenerating} title="Générer avec l'IA"><Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} /></Button>)}</CardTitle></CardHeader><CardContent className="prose prose-sm max-w-none text-muted-foreground">{isEditing ? <Textarea value={(editableRecipe as Recipe)?.commercialArgument || ''} onChange={(e) => handleRecipeDataChange('commercialArgument', e.target.value)} rows={5} placeholder="Un argumentaire de vente concis et alléchant..." /> : <p>{(recipe as Recipe).commercialArgument || 'Aucun argumentaire défini.'}</p>}</CardContent></Card>
                        </>
                    )}
                    {!isPlat && (
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
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Production totale</span>
                                                <span className="font-semibold">{currentRecipeData.productionQuantity} {currentRecipeData.productionUnit}</span>
                                            </div>
                                             <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Unité d'utilisation</span>
                                                <span className="font-semibold">{(currentRecipeData as Preparation).usageUnit || "-"}</span>
                                            </div>
                                        </div>
                                        <Separator className="my-4"/>
                                         <div className="space-y-2">
                                             <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Coût de revient / {currentRecipeData.productionUnit || 'unité'}</span>
                                                <span className="font-bold text-primary text-base">{(totalRecipeCost / (currentRecipeData.productionQuantity || 1)).toFixed(2)} DZD</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {isEditing && (<div className="fixed bottom-6 right-6 z-50"><Card className="p-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg"><Button onClick={handleSave} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? "Sauvegarde..." : 'Sauvegarder les modifications'}</Button></Card></div>)}
        </div>
    );
}

function RecipeDetailSkeleton() {
    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between"><div className="flex items-start gap-4 flex-grow"><Skeleton className="h-14 w-14 rounded-lg" /><div className="space-y-2 w-full"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div><Skeleton className="h-10 w-24" /></header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8"><Card><CardContent className="p-0"><Skeleton className="w-full h-96" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>
                <div className="space-y-8"><Card><CardHeader><Skeleton className="h-6 w-24" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-3/4" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card></div>
            </div>
        </div>
    );
}
