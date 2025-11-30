
"use client";

import { useState } from "react";
import Link from "next/link";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, ChevronsUpDown, Pencil, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ingredient, FullRecipeIngredient } from "@/lib/types";

// Extracted from RecipeDetailClient
type NewRecipeIngredient = {
    tempId: string;
    ingredientId?: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    totalCost: number;
};

// --- EDITABLE ROW FOR EXISTING INGREDIENTS ---
type EditableIngredientRowProps = {
    ing: FullRecipeIngredient;
    handleIngredientChange: (recipeIngredientId: string, field: 'quantity' | 'unit' | 'id', value: any) => void;
    handleRemoveExistingIngredient: (recipeIngredientId: string) => void;
    handleOpenEditIngredientModal: (ingredientId: string) => void;
    sortedIngredients: Ingredient[];
};

export const EditableIngredientRow = ({ ing, handleIngredientChange, handleRemoveExistingIngredient, handleOpenEditIngredientModal, sortedIngredients }: EditableIngredientRowProps) => {
    const [openCombobox, setOpenCombobox] = useState(false);

    return (
        <TableRow key={ing.recipeIngredientId}>
            <TableCell className="font-medium">
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
                                        sIng.id ? (
                                            <CommandItem key={sIng.id} value={sIng.name} onSelect={() => { handleIngredientChange(ing.recipeIngredientId, 'id', sIng.id!); setOpenCombobox(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4", ing.id === sIng.id ? "opacity-100" : "opacity-0")} />
                                                {sIng.name}
                                            </CommandItem>
                                        ) : null
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>
            <TableCell><Input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(ing.recipeIngredientId, 'quantity', parseFloat(e.target.value) || 0)} className="w-20" /></TableCell>
            <TableCell><Select value={ing.unit} onValueChange={(value) => handleIngredientChange(ing.recipeIngredientId, 'unit', value)} ><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="l">l</SelectItem><SelectItem value="pièce">pièce</SelectItem></SelectContent></Select></TableCell>
            <TableCell className="text-right font-semibold">{(ing.totalCost || 0).toFixed(2)} DZD</TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end">
                    {ing.id && (
                        <Link href={`/ingredients/${ing.id}`}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Modifier l'ingrédient de base"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Retirer l'ingrédient ?</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir retirer "{ing.name}" de cette recette ?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExistingIngredient(ing.recipeIngredientId)}>Retirer</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
        </TableRow>
    );
};


// --- NEW ROW FOR NEWLY ADDED INGREDIENTS ---
type NewIngredientRowProps = {
    newIng: NewRecipeIngredient;
    sortedIngredients: Ingredient[];
    handleNewIngredientChange: (tempId: string, field: keyof NewRecipeIngredient, value: any) => void;
    openNewIngredientModal: (tempId: string) => void;
    handleRemoveNewIngredient: (tempId: string) => void;
    handleOpenEditIngredientModal: (ingredientId: string) => void;
    handleOpenSuggestionModal: (ingredientId: string, ingredientName: string, isNew: boolean) => void;
};

export const NewIngredientRow = ({ newIng, sortedIngredients, handleNewIngredientChange, openNewIngredientModal, handleRemoveNewIngredient, handleOpenEditIngredientModal, handleOpenSuggestionModal }: NewIngredientRowProps) => {
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
                            className={cn("w-full justify-between font-normal", !newIng.ingredientId && "border-dashed border-destructive text-destructive")}
                        >
                            {newIng.ingredientId ? sortedIngredients.find((ing) => ing.id === newIng.ingredientId)?.name : newIng.name || "Choisir ou créer..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Rechercher ou créer..." value={searchTerm} onValueChange={setSearchTerm} />
                            <CommandList>
                                <CommandGroup>
                                    {filteredAndSorted.map((ing) => (
                                        <CommandItem key={ing.id} value={ing.name} onSelect={handleSelect}>
                                            <Check className={cn("mr-2 h-4 w-4", newIng.ingredientId === ing.id ? "opacity-100" : "opacity-0")} />
                                            {ing.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandEmpty>
                                    {searchTerm.length > 1 ? (
                                        <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent" onClick={handleCreateNew}>
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
            <TableCell className="text-right">
                <div className="flex items-center justify-end">
                     {newIng.ingredientId && (
                        <Link href={`/ingredients/${newIng.ingredientId}`}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Modifier l'ingrédient de base"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                     )}
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSuggestionModal(newIng.tempId, newIng.name, true)} title="Suggérer des alternatives">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveNewIngredient(newIng.tempId)} title="Supprimer la ligne">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
};

    