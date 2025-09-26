
"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "../actions";
import { Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !preview) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(preview);
      onUploadComplete(imageUrl);
      toast({
        title: "Téléversement réussi",
        description: "L'image a été mise à jour.",
      });
      handleClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur de téléversement",
        description: "Impossible d'envoyer l'image. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    setFile(null);
    setPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer l'image du plat</DialogTitle>
          <DialogDescription>
            Sélectionnez une nouvelle image depuis votre ordinateur.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="picture">Image</Label>
          <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          {preview && (
            <div className="mt-4 relative w-full aspect-video rounded-md overflow-hidden border">
                <Image src={preview} alt="Aperçu" fill style={{ objectFit: 'contain' }}/>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Téléversement...</> : <><UploadCloud className="mr-2 h-4 w-4"/> Téléverser</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
