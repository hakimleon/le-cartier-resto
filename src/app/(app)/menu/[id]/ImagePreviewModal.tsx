
"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import Image from "next/image";

type ImagePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt: string;
};

export function ImagePreviewModal({ isOpen, onClose, imageUrl, imageAlt }: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2 sm:p-4">
        <div className="relative aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            style={{ objectFit: "contain" }}
            className="rounded-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
