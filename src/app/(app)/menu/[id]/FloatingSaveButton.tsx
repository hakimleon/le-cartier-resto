
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";

type FloatingSaveButtonProps = {
  onClick: () => void;
  disabled: boolean;
};

export default function FloatingSaveButton({ onClick, disabled }: FloatingSaveButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
        <Card className="p-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg">
            <Button onClick={onClick} disabled={disabled}>
                <Save className="mr-2 h-4 w-4" />
                {disabled ? "Sauvegarde..." : `Sauvegarder les modifications`}
            </Button>
        </Card>
    </div>
  );
}
