
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { migrateRecipesToPlat } from "./actions";
import { AlertCircle, Rocket } from "lucide-react";

export default function DraftClient() {
    const [isMigrating, setIsMigrating] = useState(false);
    const { toast } = useToast();

    const handleMigration = async () => {
        setIsMigrating(true);
        try {
            const count = await migrateRecipesToPlat();
            toast({
                title: "Migration réussie !",
                description: `${count} recette(s) ont été mises à jour avec le type "Plat".`,
            });
        } catch (error) {
            console.error("Migration failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
            toast({
                title: "Erreur de migration",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
                <h4 className="font-semibold">Initialiser le type des recettes</h4>
                <p className="text-sm text-muted-foreground">
                    Parcourt toutes les recettes et ajoute le champ `type: "Plat"` si manquant.
                </p>
                <div className="flex items-center gap-2 text-xs text-amber-600 pt-1">
                    <AlertCircle className="h-4 w-4"/>
                    <span>Action à n'exécuter qu'une seule fois.</span>
                </div>
            </div>
            <Button onClick={handleMigration} disabled={isMigrating}>
                <Rocket className="mr-2 h-4 w-4" />
                {isMigrating ? "Migration en cours..." : "Lancer la migration"}
            </Button>
        </div>
    );
}
