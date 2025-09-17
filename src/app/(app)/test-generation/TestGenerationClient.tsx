"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateRecipeConcept, RecipeConceptOutput, RecipeConceptInput } from "@/ai/flows/recipe-workshop-flow";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestGenerationClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<RecipeConceptOutput | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsLoading(true);
        setResult(null);

        const instructions: RecipeConceptInput = {
            type: 'Préparation',
            name: 'Sauce au poivre',
            mainIngredients: 'Poivre noir, crème, fond brun',
            recommendations: 'Une sauce classique pour accompagner une viande rouge. Onctueuse mais pas trop lourde.',
        };

        try {
            const response = await generateRecipeConcept(instructions);
            setResult(response);
        } catch (error) {
            console.error("Error generating test concept:", error);
            toast({
                title: "Erreur de génération",
                description: "L'IA n'a pas pu générer la recette. Consultez la console pour plus de détails.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Test de Génération de Recette</CardTitle>
                    <CardDescription>
                        Cette page permet de tester directement le flow `recipe-workshop-flow` avec des données prédéfinies pour une "Sauce au poivre".
                        Le résultat JSON brut affiché ci-dessous est la réponse exacte de l'IA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isLoading ? "Génération en cours..." : "Générer une Sauce au Poivre"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Résultat JSON Brut</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[220px]" />
                        </div>
                    ) : (
                        <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                            {result ? JSON.stringify(result, null, 2) : "Cliquez sur le bouton pour lancer la génération."}
                        </pre>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
