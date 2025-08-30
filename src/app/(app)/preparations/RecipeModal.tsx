
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecipeForm } from "./RecipeForm";
import { Recipe } from "@/lib/types";
import { ReactNode, useState } from "react";

type RecipeModalProps = {
  children: ReactNode;
  recipe: Recipe | null;
  type: 'Plat' | 'Préparation';
  onSuccess: () => void;
};

export function RecipeModal({ children, recipe, type, onSuccess }: RecipeModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
        onSuccess();
    }
    
    const title = recipe ? `Modifier la ${type.toLowerCase()}` : `Nouvelle ${type.toLowerCase()}`;
    const description = recipe
      ? `Modifiez les détails de la ${type.toLowerCase()} ci-dessous.`
      : `Ajoutez une nouvelle ${type.toLowerCase()} à votre base de données.`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <RecipeForm recipe={recipe} type={type} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
