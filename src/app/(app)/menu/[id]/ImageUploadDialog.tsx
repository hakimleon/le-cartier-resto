
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImageToServer } from "../actions";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast({
                title: "Aucun fichier sélectionné",
                description: "Veuillez choisir une image à téléverser.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);

        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            const base64String = reader.result as string;
            try {
                const newUrl = await uploadImageToServer(base64String);
                onUploadComplete(newUrl);
                toast({
                    title: "Succès !",
                    description: "L'image a été téléversée et mise à jour.",
                });
                onClose();
            } catch (error) {
                 console.error("Upload error:", error);
                 toast({
                    title: "Erreur de téléversement",
                    description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
                    variant: "destructive",
                });
            } finally {
                 setIsUploading(false);
            }
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            toast({
                title: "Erreur de lecture du fichier",
                description: "Impossible de lire le fichier sélectionné.",
                variant: "destructive",
            });
            setIsUploading(false);
        };
    };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isUploading) onClose()}}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Changer l'image du plat</DialogTitle>
                <DialogDescription>
                    Téléversez une nouvelle image depuis votre ordinateur.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <Input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} disabled={isUploading}/>
                {selectedFile && <p className="text-sm text-muted-foreground">Fichier sélectionné : {selectedFile.name}</p>}
                 <Button onClick={handleUpload} disabled={isUploading || !selectedFile} className="w-full">
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Téléversement...</span>
                        </>
                    ) : (
                         <>
                            <ImagePlus className="mr-2 h-4 w-4" />
                            <span>Téléverser et mettre à jour</span>
                        </>
                    )}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}
