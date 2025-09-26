
"use client";

import { useState, useEffect, use } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCloudinaryImages, CloudinaryImage } from "../cloudinary-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

function UploadTab({ onUploadComplete, handleClose }: { onUploadComplete: (url: string) => void, handleClose: () => void }) {
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

    const handleUpload = async () => {
        if (!file) {
            toast({ title: "Aucun fichier sélectionné", variant: "destructive" });
            return;
        }
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            toast({ title: "Erreur de configuration", description: "Les variables d'environnement Cloudinary sont manquantes.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", "le-singulier-ai-generated");

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
        <div className="space-y-4 py-4">
             {preview ? (
                <div className="relative">
                <Image src={preview} alt="Aperçu" width={400} height={300} className="w-full h-auto max-h-80 rounded-md object-contain" />
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
             <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={isUploading}>Annuler</Button>
                <Button onClick={handleUpload} disabled={!file || isUploading}>
                    {isUploading ? "Téléversement..." : "Téléverser et utiliser"}
                </Button>
            </DialogFooter>
        </div>
    )
}

function GalleryTab({ onSelect }: { onSelect: (url: string) => void }) {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        getCloudinaryImages()
            .then(data => setImages(data))
            .catch(err => console.error("Failed to load cloudinary images"))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSelect = () => {
        if(selectedUrl) onSelect(selectedUrl);
    }
    
    return (
        <div className="py-4">
            <ScrollArea className="h-96 pr-4">
                 {isLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="aspect-square bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                 ) : (
                    images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {images.map(image => (
                                <button key={image.asset_id} onClick={() => setSelectedUrl(image.secure_url)} className="relative aspect-square rounded overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                    <Image src={image.secure_url} alt={image.public_id} fill sizes="33vw" className="object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {selectedUrl === image.secure_url && (
                                        <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                                            <CheckCircle2 className="h-8 w-8 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <ImageIcon className="h-10 w-10 mb-4" />
                            <h3 className="font-semibold">Galerie vide</h3>
                            <p className="text-sm">Aucune image trouvée dans le dossier Cloudinary.</p>
                        </div>
                    )
                 )}
            </ScrollArea>
             <DialogFooter className="mt-4">
                <Button onClick={handleSelect} disabled={!selectedUrl || isLoading}>
                    <ImageIcon className="mr-2 h-4 w-4"/>
                    Utiliser l'image sélectionnée
                </Button>
            </DialogFooter>
        </div>
    )
}


export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
  
  const resetStateAndClose = () => {
      onClose();
  }

  const handleSelect = (url: string) => {
    onUploadComplete(url);
    resetStateAndClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetStateAndClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Médiathèque</DialogTitle>
          <DialogDescription>
            Téléversez une nouvelle image ou choisissez-en une dans votre galerie Cloudinary.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Téléverser une image</TabsTrigger>
                <TabsTrigger value="gallery">Galerie Cloudinary</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
                <UploadTab onUploadComplete={onUploadComplete} handleClose={resetStateAndClose} />
            </TabsContent>
            <TabsContent value="gallery">
                <GalleryTab onSelect={handleSelect} />
            </TabsContent>
        </Tabs>
        
      </DialogContent>
    </Dialog>
  );
}
