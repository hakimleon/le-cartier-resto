
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker } from "lucide-react";
import DraftClient from "./DraftClient";
import { MigrateIngredients } from "./MigrateIngredients";

export default function DraftPage() {
  return (
    <div className="container mx-auto py-10">
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                 <div className="bg-muted text-muted-foreground rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                    <Beaker className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Page de Brouillon</h1>
                    <p className="text-muted-foreground">Cet espace est dédié aux actions uniques et aux migrations de données.</p>
                </div>
            </header>
            
            <Card>
                <CardHeader>
                    <CardTitle>Outils de migration</CardTitle>
                    <CardDescription>
                        Utilisez ces outils pour mettre à jour la structure de vos données.
                        Ces actions sont généralement à n'exécuter qu'une seule fois.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DraftClient />
                    <MigrateIngredients />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
