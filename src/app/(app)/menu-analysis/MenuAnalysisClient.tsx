"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function MenuAnalysisClient() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu</h1>
                <p className="text-muted-foreground">Synthèse, production et rentabilité de vos plats actifs.</p>
            </header>
            <Card className="flex flex-col items-center justify-center p-20 text-center">
                <BrainCircuit className="h-16 w-16 text-primary mb-4"/>
                <CardTitle>Fonctionnalité en cours de reconstruction</CardTitle>
                <CardDescription className="mt-2 max-w-md">
                    Suite à des instabilités techniques, cette page est en cours de refonte complète pour garantir sa fiabilité. Elle sera de retour prochainement, plus performante que jamais. Merci de votre patience.
                </CardDescription>
            </Card>
        </div>
    );
}
