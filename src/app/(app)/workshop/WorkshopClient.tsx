
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateDishConcept, DishConceptOutput } from "@/ai/flows/workshop-flow";
import { useRouter } from "next/navigation";
import { saveDish } from "../menu/actions";

export default function WorkshopClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedConcept, setGeneratedConcept] = useState<DishConceptOutput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const dishName = formData.get("dishName") as string;
        const mainIngredients = formData.get("mainIngredients") as string;
        const excludedIngredients = formData.get("excludedIngredients") as string;
        const recommendations = formData.get("recommendations") as string;

        if (!dishName || !mainIngredients) {
            toast({
                title: "Champs requis",
                description: "Veuillez renseigner au moins le nom du plat et les ingrédients principaux.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setGeneratedConcept(null);

        try {
            const result = await generateDishConcept({
                dishName,
                mainIngredients,
                excludedIngredients,
                recommendations,
            });
            setGeneratedConcept(result);
        } catch (error) {
            console.error("Error generating dish concept:", error);
            toast({
                title: "Erreur de l'IA",
                description: "La génération du concept a échoué. Veuillez réessayer.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToMenu = async () => {
        if (!generatedConcept) return;

        setIsSaving(true);
        try {
            await saveDish({
                type: 'Plat',
                name: generatedConcept.name,
                description: generatedConcept.description,
                imageUrl: generatedConcept.imageUrl,
                procedure_preparation: generatedConcept.procedure,
                procedure_service: generatedConcept.plating,
                // Default values that can be edited later
                price: 0,
                portions: 1,
                status: 'Inactif',
                category: 'Plats et Grillades',
                difficulty: 'Moyen',
                duration: 30,
                tvaRate: 10,
            }, null);

            toast({
                title: "Recette enregistrée !",
                description: `"${generatedConcept.name}" a été ajouté au menu en tant que plat inactif.`,
            });
            router.push('/menu');

        } catch (error) {
            console.error("Error saving dish:", error);
            toast({
                title: "Erreur de sauvegarde",
                description: "Impossible d'enregistrer le plat dans le menu.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center gap-4">
                 <div className="bg-muted text-muted-foreground rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                    <FlaskConical className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Atelier des Recettes</h1>
                    <p className="text-muted-foreground">Donnez vie à vos idées de plats avec l'aide de l'IA.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vos Instructions</CardTitle>
                            <CardDescription>Décrivez le plat que vous imaginez.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="dishName">Nom du plat</Label>
                                    <Input id="dishName" name="dishName" placeholder="Ex: Bar de ligne nacré..." />
                                </div>
                                <div>
                                    <Label htmlFor="mainIngredients">Ingrédients principaux</Label>
                                    <Input id="mainIngredients" name="mainIngredients" placeholder="Ex: Bar, Orange, Fenouil" />
                                </div>
                                <div>
                                    <Label htmlFor="excludedIngredients">Ingrédients à exclure</Label>
                                    <Input id="excludedIngredients" name="excludedIngredients" placeholder="Ex: Vin, crème, porc" />
                                </div>
                                <div>
                                    <Label htmlFor="recommendations">Recommandations</Label>
                                    <Textarea id="recommendations" name="recommendations" placeholder="Ex: Un plat frais, méditerranéen, avec un dressage très graphique..." />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isLoading ? "Génération en cours..." : "Générer le concept"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="min-h-[500px]">
                        <CardHeader>
                            <CardTitle>Proposition de l'IA</CardTitle>
                            <CardDescription>Voici le concept de plat généré par l'IA.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="w-full h-64 rounded-lg" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ) : generatedConcept ? (
                                <div className="space-y-6">
                                     <div className="relative w-full h-80 rounded-lg overflow-hidden border">
                                        <Image src={generatedConcept.imageUrl} alt={generatedConcept.name} layout="fill" objectFit="cover" data-ai-hint="artistic food plating" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{generatedConcept.name}</h3>
                                        <p className="text-muted-foreground mt-2">{generatedConcept.description}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Ingrédients suggérés</h4>
                                        <ul className="list-disc list-inside text-muted-foreground mt-2">
                                            {generatedConcept.ingredients.map((ing: string) => <li key={ing}>{ing}</li>)}
                                        </ul>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold">Procédure</h4>
                                        <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{generatedConcept.procedure}</p>
                                    </div>
                                      <div>
                                        <h4 className="font-semibold">Dressage</h4>
                                        <p className="text-muted-foreground mt-2">{generatedConcept.plating}</p>
                                    </div>
                                    <Button className="w-full" onClick={handleSaveToMenu} disabled={isSaving}>
                                        {isSaving ? "Enregistrement..." : "Enregistrer la recette au menu"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-80">
                                    <FlaskConical className="h-12 w-12 text-muted-foreground/50" />
                                    <p className="mt-4 text-muted-foreground">Les résultats s'afficheront ici.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
