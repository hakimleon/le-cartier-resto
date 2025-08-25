"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IngredientForm } from "./IngredientForm";
import { Ingredient } from "@/lib/types";
import { ReactNode, useState } from "react";

type IngredientModalProps = {
  children: ReactNode;
  ingredient: Ingredient | null;
  onSuccess: () => void;
};

export function IngredientModal({ children, ingredient, onSuccess }: IngredientModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
        onSuccess();
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ingredient ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}</DialogTitle>
          <DialogDescription>
            {ingredient
              ? "Modifiez les détails de l'ingrédient ci-dessous."
              : "Ajoutez un nouvel ingrédient à votre inventaire."}
          </DialogDescription>
        </DialogHeader>
        <IngredientForm ingredient={ingredient} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
