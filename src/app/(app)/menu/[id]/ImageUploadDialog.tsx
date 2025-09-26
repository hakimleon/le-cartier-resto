
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CldUploadButton } from "next-cloudinary";
import { ImagePlus, AlertTriangle } from "lucide-react";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const FOLDER_NAME = 'le-singulier-ai-generated';

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
    const { toast } = useToast();
    
    const handleSuccess = (result: any) => {
        if (result.event === 'success' && result.info?.secure_url) {
            onUploadComplete(result.info.secure_url);
            onClose();
            toast({
                title: "Image téléversée !",
                description: "La nouvelle image a bien été ajoutée.",
            });
        }
    };

    const handleError = (error: any) => {
        console.error("Cloudinary upload error:", error);
        toast({
            title: "Erreur de téléversement",
            description: "Impossible d'interagir avec Cloudinary. Vérifiez la configuration.",
            variant: "destructive",
        });
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Changer l'image du plat</DialogTitle>
                <DialogDescription>
                    Téléversez une nouvelle image depuis votre ordinateur.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                {!CLOUD_NAME || !UPLOAD_PRESET ? (
                    <div className="text-center text-destructive p-4 max-w-md">
                        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                        <p className="font-semibold">Configuration Cloudinary incomplète</p>
                        <p className="text-sm text-muted-foreground">
                            Vérifiez que `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` sont définis.
                        </p>
                    </div>
                ) : (
                    <CldUploadButton
                        uploadPreset={UPLOAD_PRESET}
                        onSuccess={handleSuccess}
                        onError={handleError}
                        options={{
                            sources: ['local', 'url'],
                            folder: FOLDER_NAME,
                            clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
                            multiple: false,
                        }}
                    >
                        <div className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md cursor-pointer">
                            <ImagePlus className="h-5 w-5"/>
                            <span>Téléverser une image</span>
                        </div>
                    </CldUploadButton>
                )}
                 <p className="text-xs text-muted-foreground mt-4 text-center">
                    Les images seront enregistrées dans le dossier "{FOLDER_NAME}".
                </p>
            </div>
        </DialogContent>
    </Dialog>
  );
}

