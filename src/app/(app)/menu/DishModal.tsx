
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DishForm } from "./DishForm";
import { Recipe } from "@/lib/types";
import { ReactNode, useState } from "react";

type DishModalProps = {
  children: ReactNode;
  dish: Recipe | null;
  onSuccess: () => void;
};

export function DishModal({ children, dish, onSuccess }: DishModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
        onSuccess();
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dish ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
          <DialogDescription>
            {dish
              ? "Modifiez les détails du plat ci-dessous."
              : "Ajoutez un nouveau plat à votre menu ici."}
          </DialogDescription>
        </DialogHeader>
        <DishForm dish={dish} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
