
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, X } from "lucide-react";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setIsUploading(false);
    setUploadProgress(0);
  }

  const handleClose = () => {
      resetState();
      onClose();
  }

  const handleUpload = async () => {
    if (!file) {
        toast({ title: "Aucun fichier sélectionné", variant: "destructive" });
        return;
    }
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        toast({ title: "Erreur de configuration", description: "Les variables d'environnement Cloudinary sont manquantes.", variant: "destructive" });
        console.error("Cloudinary environment variables not set.");
        return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        toast({ title: "Succès", description: "L'image a été téléversée." });
        onUploadComplete(response.secure_url);
        handleClose();
      } else {
        const error = JSON.parse(xhr.responseText).error;
        toast({ title: "Erreur de téléversement", description: error.message || "Une erreur est survenue.", variant: "destructive" });
        setIsUploading(false);
      }
    };
    
    xhr.onerror = () => {
        toast({ title: "Erreur réseau", description: "Impossible de se connecter à Cloudinary.", variant: "destructive" });
        setIsUploading(false);
    };

    xhr.send(formData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer la photo du plat</DialogTitle>
          <DialogDescription>
            Sélectionnez une nouvelle image à téléverser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <Image src={preview} alt="Aperçu" width={400} height={300} className="w-full h-auto rounded-md object-cover" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setFile(null); setPreview(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
             <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Cliquez pour choisir</span> ou glissez-déposez</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (MAX. 10MB)</p>
                </div>
                <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
            </label>
          )}

          {isUploading && (
            <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">{uploadProgress}%</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>Annuler</Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Téléversement..." : "Téléverser et utiliser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
