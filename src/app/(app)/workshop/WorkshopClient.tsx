
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Sparkles, PlusCircle, NotebookText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateDishConcept, DishConceptOutput } from "@/ai/flows/workshop-flow";
import { useRouter } from "next/navigation";
import { createDishFromWorkshop } from "./actions";

export default function WorkshopClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedConcept, setGeneratedConcept] = useState<DishConceptOutput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const dishName = formData.get("dishName") as string;
        const mainIngredients = formData.get("mainIngredients") as string;
        const excludedIngredients = formData.get("excludedIngredients") as string;
        const recommendations = formData.get("recommendations") as string;

        if (!dishName) {
            toast({
                title: "Champ requis",
                description: "Veuillez renseigner le nom du plat.",
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
            const newDishId = await createDishFromWorkshop(generatedConcept);

            if (newDishId) {
                toast({
                    title: "Recette enregistrée !",
                    description: `"${generatedConcept.name}" a été ajouté au menu.`,
                });
                router.push(`/menu/${newDishId}`);
            } else {
                 throw new Error("L'ID du plat n'a pas été retourné après la création.");
            }

        } catch (error) {
            console.error("Error saving dish from workshop:", error);
            toast({
                title: "Erreur de sauvegarde",
                description: "Impossible d'enregistrer le plat et ses ingrédients.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleNewRecipe = () => {
        setGeneratedConcept(null);
        if (formRef.current) {
            formRef.current.reset();
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
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="dishName">Nom du plat <span className="text-destructive">*</span></Label>
                                    <Input id="dishName" name="dishName" placeholder="Ex: Bar de ligne nacré..." required />
                                </div>
                                <div>
                                    <Label htmlFor="mainIngredients">Ingrédients principaux (Optionnel)</Label>
                                    <Input id="mainIngredients" name="mainIngredients" placeholder="Ex: Bar, Orange, Fenouil" />
                                </div>
                                <div>
                                    <Label htmlFor="excludedIngredients">Ingrédients à exclure (Optionnel)</Label>
                                    <Input id="excludedIngredients" name="excludedIngredients" placeholder="Ex: Vin, crème, porc" />
                                </div>
                                <div>
                                    <Label htmlFor="recommendations">Recommandations (Optionnel)</Label>
                                    <Textarea id="recommendations" name="recommendations" placeholder="Ex: Un plat frais, méditerranéen..." />
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Proposition de l'IA</CardTitle>
                                <CardDescription>Voici le concept de plat généré par l'IA.</CardDescription>
                            </div>
                             {generatedConcept && (
                                <Button variant="outline" onClick={handleNewRecipe}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Nouvelle Recette
                                </Button>
                            )}
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
                                        <Image src={generatedConcept.imageUrl} alt={generatedConcept.name} fill style={{ objectFit: 'cover' }} data-ai-hint="artistic food plating" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{generatedConcept.name}</h3>
                                        <p className="text-muted-foreground mt-2">{generatedConcept.description}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold">Ingrédients suggérés</h4>
                                            <ul className="list-disc list-inside text-muted-foreground mt-2">
                                                {generatedConcept.ingredients.map((ing: string) => <li key={ing}>{ing}</li>)}
                                            </ul>
                                        </div>
                                         {generatedConcept.subRecipes && generatedConcept.subRecipes.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold">Sous-Recettes Nécessaires</h4>
                                                <ul className="list-disc list-inside text-muted-foreground mt-2">
                                                    {generatedConcept.subRecipes.map((prep: string) => <li key={prep}>{prep}</li>)}
                                                </ul>
                                            </div>
                                         )}
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
