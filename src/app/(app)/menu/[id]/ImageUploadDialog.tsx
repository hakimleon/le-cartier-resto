
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CldUploadButton, CldUploadWidget } from "next-cloudinary";
import { ImagePlus, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudinaryResource } from "../cloudinary-actions";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  cloudinaryImages: CloudinaryResource[];
  isLoadingImages: boolean;
  imagesError: string | null;
};

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const FOLDER_NAME = 'le-singulier-ai-generated';

function GalleryTab({ 
    images, 
    isLoading, 
    error, 
    onSelect 
}: { 
    images: CloudinaryResource[]; 
    isLoading: boolean;
    error: string | null;
    onSelect: (url: string) => void 
}) {
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    
    const handleSelectAndConfirm = () => {
        if (selectedUrl) {
            onSelect(selectedUrl);
        }
    };
    
    if (isLoading) {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-md" />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                 <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="font-semibold text-lg">Erreur de chargement</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        )
    }
    
    if (images.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                <p>La galerie Cloudinary est vide.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-grow">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4">
                    {images.map(image => (
                        <button
                            key={image.public_id}
                            onClick={() => setSelectedUrl(image.secure_url)}
                            className={cn(
                                "relative aspect-square w-full overflow-hidden rounded-md transition-all group",
                                selectedUrl === image.secure_url && "ring-4 ring-primary ring-offset-2"
                            )}
                        >
                            <Image
                                src={image.secure_url}
                                alt={image.public_id}
                                fill
                                sizes="(max-width: 640px) 33vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform"
                            />
                            {selectedUrl === image.secure_url && (
                                <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-primary-foreground" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>
             <div className="shrink-0 p-4 border-t mt-auto">
                <Button onClick={handleSelectAndConfirm} disabled={!selectedUrl} className="w-full">
                    Utiliser l'image sélectionnée
                </Button>
            </div>
        </div>
    );
}

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete, cloudinaryImages, isLoadingImages, imagesError }: ImageUploadDialogProps) {
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
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle>Médiathèque</DialogTitle>
                <DialogDescription>
                    Choisissez une image existante dans votre galerie ou téléversez-en une nouvelle.
                </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="gallery" className="flex-grow overflow-hidden flex flex-col">
                <div className="px-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gallery">Galerie Cloudinary</TabsTrigger>
                        <TabsTrigger value="upload">Téléverser une image</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="gallery" className="flex-grow mt-0 overflow-y-auto">
                    <GalleryTab 
                        images={cloudinaryImages} 
                        isLoading={isLoadingImages}
                        error={imagesError}
                        onSelect={onUploadComplete} 
                    />
                </TabsContent>

                <TabsContent value="upload" className="mt-0 flex-grow">
                    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg m-4">
                        {!CLOUD_NAME || !UPLOAD_PRESET ? (
                            <div className="text-center text-destructive p-4 max-w-md">
                                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                                <p className="font-semibold">Configuration Cloudinary incomplète</p>
                                <p className="text-sm text-muted-foreground">
                                    Veuillez vérifier que les variables d'environnement suivantes sont bien définies dans votre fichier `.env`:
                                    <code className="block bg-muted text-destructive-foreground p-2 rounded-md my-2 text-xs">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME<br/>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>
                                </p>
                            </div>
                        ) : (
                            <CldUploadButton
                                uploadPreset={UPLOAD_PRESET}
                                onSuccess={handleSuccess}
                                onError={handleError}
                                options={{
                                    sources: ['local', 'url', 'camera'],
                                    folder: FOLDER_NAME,
                                    clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
                                    multiple: false,
                                }}
                            >
                                <div className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md cursor-pointer">
                                    <ImagePlus className="h-5 w-5"/>
                                    <span>Téléverser depuis mon ordinateur</span>
                                </div>
                            </CldUploadButton>
                        )}
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                           Les nouvelles images seront enregistrées dans le dossier "{FOLDER_NAME}".
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
  );
}
