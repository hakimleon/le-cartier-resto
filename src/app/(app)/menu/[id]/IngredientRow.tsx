
"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Merge, Trash2 } from "lucide-react";
import type { FullRecipeIngredient, Preparation } from "@/lib/types";

type IngredientRowProps = {
    ing: FullRecipeIngredient;
    allPreparations: Preparation[];
    handleIngredientChange: (recipeIngredientId: string, field: 'quantity' | 'unit', value: any) => void;
    handleSubstituteIngredient: (recipeIngredientId: string, isNew: boolean) => void;
    handleRemoveExistingIngredient: (recipeIngredientId: string) => void;
};

export default function IngredientRow({ ing, allPreparations, handleIngredientChange, handleSubstituteIngredient, handleRemoveExistingIngredient }: IngredientRowProps) {
    const substitutionTarget = allPreparations.find(p => p.name.toLowerCase() === ing.name.toLowerCase());

    return (
        <TableRow key={ing.recipeIngredientId}>
            <TableCell className="font-medium flex items-center gap-1">
                {substitutionTarget ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSubstituteIngredient(ing.recipeIngredientId, false)}>
                                    <Merge className="h-4 w-4 text-primary" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Substituer par la préparation "{substitutionTarget.name}"</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <div className="w-9 h-9" /> // Placeholder for alignment
                )}
                {ing.name}
            </TableCell>
            <TableCell>
                <Input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(ing.recipeIngredientId, 'quantity', parseFloat(e.target.value) || 0)} className="w-20" />
            </TableCell>
            <TableCell>
                <Select value={ing.unit} onValueChange={(value) => handleIngredientChange(ing.recipeIngredientId, 'unit', value)} >
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
                {(ing.totalCost || 0).toFixed(2)} DZD
            </TableCell>
            <TableCell>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Retirer l'ingrédient ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir retirer "{ing.name}" de cette recette ? Cette action prendra effet à la sauvegarde.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveExistingIngredient(ing.recipeIngredientId)}>Retirer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    );
}
