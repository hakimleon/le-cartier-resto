
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

        // This modal is now only for editing, not creating.
        // The creation flow is handled by the workshop.
    }
    
    const title = `Modifier la préparation`;
    const description = `Modifiez les détails de la préparation ci-dessous.`;

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
