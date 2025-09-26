"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CldUploadWidget } from "next-cloudinary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCloudinaryImages } from "../cloudinary-actions";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
};

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

type CloudinaryResource = {
    public_id: string;
    secure_url: string;
};

export function ImageUploadDialog({ isOpen, onClose, onUploadComplete }: ImageUploadDialogProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("gallery");
    const [images, setImages] = useState<CloudinaryResource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);


    useEffect(() => {
        if (isOpen && activeTab === 'gallery') {
            const fetchImages = async () => {
                setIsLoading(true);
                setSelectedImage(null);
                try {
                    const fetchedImages = await getCloudinaryImages();
                    setImages(fetchedImages);
                } catch (error) {
                    console.error("Failed to fetch Cloudinary images:", error);
                    toast({
                        title: "Erreur de galerie",
                        description: "Impossible de charger les images depuis Cloudinary.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchImages();
        }
    }, [isOpen, activeTab, toast]);

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
            title: "Erreur de téléversement",
            description: "Impossible de téléverser l'image. Veuillez réessayer.",
            variant: "destructive",
        });
    };

    const handleSelectFromGallery = () => {
        if (selectedImage) {
            onUploadComplete(selectedImage);
            onClose();
            toast({
                title: "Image sélectionnée",
                description: "L'image du plat a été mise à jour.",
            });
        }
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Médiathèque</DialogTitle>
                <DialogDescription>
                    Choisissez une image existante dans votre galerie ou téléversez-en une nouvelle.
                </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gallery">Galerie Cloudinary</TabsTrigger>
                    <TabsTrigger value="upload">Téléverser une image</TabsTrigger>
                </TabsList>
                <TabsContent value="gallery" className="mt-4">
                     <ScrollArea className="h-96 pr-4">
                        {isLoading ? (
                            <div className="grid grid-cols-4 gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="aspect-square w-full rounded-md" />
                                ))}
                            </div>
                        ) : images.length > 0 ? (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((image) => (
                                    <div
                                        key={image.public_id}
                                        className="relative aspect-square cursor-pointer group"
                                        onClick={() => setSelectedImage(image.secure_url)}
                                    >
                                        <Image
                                            src={image.secure_url}
                                            alt={image.public_id}
                                            fill
                                            sizes="150px"
                                            className="rounded-md object-cover"
                                        />
                                        {selectedImage === image.secure_url && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 ring-2 ring-primary">
                                                <CheckCircle className="h-8 w-8 text-white" />
                                            </div>
                                        )}
                                         <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-transparent group-hover:ring-primary/50 transition-all"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-80 items-center justify-center text-center">
                                <p className="text-muted-foreground">
                                    Galerie vide. <br/>
                                    Téléversez une image pour la voir ici.
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleSelectFromGallery} disabled={!selectedImage}>
                            Utiliser l'image sélectionnée
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="upload">
                     <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-lg">
                        <CldUploadWidget
                            uploadPreset={UPLOAD_PRESET}
                             options={{
                                folder: 'le-singulier-ai-generated',
                                clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
                            }}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        >
                            {({ open }) => (
                                <Button onClick={() => open()} disabled={!UPLOAD_PRESET}>
                                    Téléverser une image
                                </Button>
                            )}
                        </CldUploadWidget>

                        {!UPLOAD_PRESET && (
                            <p className="text-sm text-destructive mt-4">
                                Erreur: `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` est manquant.
                            </p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
  );
}
