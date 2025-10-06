
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { IngredientForm } from "./IngredientForm";
import { Ingredient } from "@/lib/types";
import { ReactNode, useState } from "react";

type IngredientModalProps = {
  children: ReactNode;
  ingredient: Partial<Ingredient> | null;
  onSuccess: (newIngredient?: Ingredient) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function IngredientModal({ children, ingredient, onSuccess, open, onOpenChange }: IngredientModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

    const handleSuccess = (newIngredient?: Ingredient) => {
        setIsOpen(false);
        onSuccess(newIngredient);
    }
    
    const title = ingredient?.id ? "Modifier l'ingrédient" : "Nouvel ingrédient";
    const description = ingredient?.id
      ? "Modifiez les détails de l'ingrédient ci-dessous."
      : "Ajoutez un nouvel ingrédient à votre inventaire.";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90svh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <IngredientForm ingredient={ingredient} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
