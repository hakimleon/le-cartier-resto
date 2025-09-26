"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
      title: "Erreur de téléversement",
      description: "Impossible de téléverser l'image. Veuillez réessayer.",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Médiathèque</DialogTitle>
          <DialogDescription>
            Choisissez une image depuis votre galerie ou téléversez-en une nouvelle.
          </DialogDescription>
        </DialogHeader>

        <CldUploadWidget
          uploadPreset={UPLOAD_PRESET}
          options={{
            sources: ['local', 'url', 'camera', 'media_library'],
            defaultSource: 'media_library',
            multiple: false,
            maxFiles: 1,
            folder: 'le-singulier-ai-generated',
            clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
            theme: "minimal",
            language: 'fr',
            text: {
                fr: {
                    "source_local_title": "Mes fichiers",
                    "source_url_title": "Lien Web",
                    "source_camera_title": "Caméra",
                    "source_media_library_title": "Ma Médiathèque",
                    "actions_cancel": "Annuler",
                    "actions_select": "Sélectionner",
                    "actions_upload": "Téléverser",
                    "labels_sources": "Source",
                }
            }
          }}
          onSuccess={handleSuccess}
          onError={handleError}
        >
          {({ open }) => {
            return (
              <Button onClick={() => open()} disabled={!UPLOAD_PRESET}>
                Ouvrir la médiathèque Cloudinary
              </Button>
            );
          }}
        </CldUploadWidget>

        {!UPLOAD_PRESET && (
            <p className="text-sm text-destructive">
                Erreur de configuration : La variable d'environnement `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` est manquante.
            </p>
        )}

      </DialogContent>
    </Dialog>
  );
}
