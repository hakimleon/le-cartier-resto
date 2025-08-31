"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PreparationForm } from "./PreparationForm";
import { Preparation } from "@/lib/types";
import { ReactNode, useState } from "react";

type PreparationModalProps = {
  children: ReactNode;
  preparation: Preparation | null;
  onSuccess: () => void;
};

export function PreparationModal({ children, preparation, onSuccess }: PreparationModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
        onSuccess();
    }
    
    const title = preparation ? `Modifier la préparation` : `Nouvelle préparation`;
    const description = preparation
      ? `Modifiez les détails de la préparation ci-dessous.`
      : `Ajoutez une nouvelle préparation à votre base de données.`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <PreparationForm preparation={preparation} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
