"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CldUploadButton } from "next-cloudinary";
import { ImagePlus } from "lucide-react";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
    const { toast } = useToast();
    
    const handleSuccess = (result: any) => {
        if (result.event === 'success' && result.info?.secure_url) {
            onUploadComplete(result.info.secure_url);
            onClose();
            toast({
                title: "Image sélectionnée",
                description: "L'image du plat a été mise à jour.",
            });
        }
    };

    const handleError = (error: any) => {
        console.error("Cloudinary upload error:", error);
        toast({
            title: "Erreur de la médiathèque",
            description: "Impossible d'interagir avec la médiathèque Cloudinary. Vérifiez la configuration.",
            variant: "destructive",
        });
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Changer l'image du plat</DialogTitle>
                <DialogDescription>
                    Ouvrez la médiathèque pour choisir une image existante ou en téléverser une nouvelle.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center h-56 border-2 border-dashed rounded-lg">
                <CldUploadButton
                    uploadPreset={UPLOAD_PRESET}
                    options={{
                        sources: ['local', 'media_library', 'url'],
                        defaultSource: 'media_library',
                        folder: 'le-singulier-ai-generated',
                        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
                        multiple: false,
                    }}
                    onSuccess={handleSuccess}
                    onError={handleError}
                >
                    <div className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md cursor-pointer">
                        <ImagePlus className="h-5 w-5"/>
                        <span>Ouvrir la Médiathèque</span>
                    </div>
                </CldUploadButton>

                {!UPLOAD_PRESET && (
                    <p className="text-sm text-destructive mt-4 text-center">
                        Erreur: La variable d'environnement `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` est manquante.
                    </p>
                )}
                 <p className="text-xs text-muted-foreground mt-4 text-center">
                    Ceci ouvrira votre médiathèque Cloudinary.
                </p>
            </div>
        </DialogContent>
    </Dialog>
  );
}
