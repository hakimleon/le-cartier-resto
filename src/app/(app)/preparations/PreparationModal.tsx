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
import { useRouter } from "next/navigation";

type PreparationModalProps = {
  children: ReactNode;
  preparation: Partial<Preparation> | null;
  onSuccess: (newPreparation?: Preparation) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function PreparationModal({ children, preparation, onSuccess, open, onOpenChange }: PreparationModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const router = useRouter();

    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
    
    const handleSuccess = (newPreparation?: Preparation) => {
        setIsOpen(false);
        onSuccess(newPreparation);

        // Si c'est une nouvelle préparation, rediriger vers sa page de détail.
        if (newPreparation && !preparation?.id) {
            router.push(`/preparations/${newPreparation.id}`);
        }
    }
    
    const title = preparation?.id ? `Modifier la préparation` : `Nouvelle préparation`;
    const description = preparation?.id
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
