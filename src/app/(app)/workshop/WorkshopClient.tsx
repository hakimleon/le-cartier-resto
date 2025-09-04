
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Sparkles, PlusCircle, NotebookText, Clock, Soup, Users, MessageSquareQuote, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateDishConcept, DishConceptOutput } from "@/ai/flows/workshop-flow";
import { useRouter } from "next/navigation";
import { createDishFromWorkshop } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                                    <Label htmlFor="dishName">Nom du plat (Optionnel)</Label>
                                    <Input id="dishName" name="dishName" placeholder="Ex: Bar de ligne nacré..." />
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
                                <CardDescription>Voici la fiche technique générée par l'IA.</CardDescription>
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
                                <div className="space-y-4 p-4">
                                    <Skeleton className="w-full h-64 rounded-lg" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
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
                                        <h3 className="text-2xl font-bold">{generatedConcept.name}</h3>
                                        <p className="text-muted-foreground mt-1">{generatedConcept.description}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center p-2 rounded-lg border bg-muted/50">
                                        <div className="flex flex-col items-center gap-1">
                                            <Clock className="h-5 w-5 text-muted-foreground"/>
                                            <span className="text-sm font-semibold">{generatedConcept.duration} min</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Soup className="h-5 w-5 text-muted-foreground"/>
                                            <span className="text-sm font-semibold">{generatedConcept.difficulty}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Users className="h-5 w-5 text-muted-foreground"/>
                                            <span className="text-sm font-semibold">{generatedConcept.portions} portion{generatedConcept.portions > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold mb-2">Ingrédients Suggérés</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {generatedConcept.ingredients.map((ing: string) => <Badge key={ing} variant="secondary">{ing}</Badge>)}
                                            </div>
                                        </div>
                                         {generatedConcept.subRecipes && generatedConcept.subRecipes.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Sous-Recettes</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {generatedConcept.subRecipes.map((prep: string) => <Badge key={prep} variant="outline" className="text-primary border-primary/50">{prep}</Badge>)}
                                                </div>
                                            </div>
                                         )}
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4"/>Procédure Technique</h4>
                                        <Tabs defaultValue="preparation" className="w-full">
                                            <TabsList>
                                                <TabsTrigger value="preparation">Préparation</TabsTrigger>
                                                <TabsTrigger value="cuisson">Cuisson</TabsTrigger>
                                                <TabsTrigger value="service">Service & Dressage</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="preparation" className="text-sm text-muted-foreground whitespace-pre-wrap p-2">{generatedConcept.procedure_preparation}</TabsContent>
                                            <TabsContent value="cuisson" className="text-sm text-muted-foreground whitespace-pre-wrap p-2">{generatedConcept.procedure_cuisson}</TabsContent>
                                            <TabsContent value="service" className="text-sm text-muted-foreground whitespace-pre-wrap p-2">{generatedConcept.procedure_service}</TabsContent>
                                        </Tabs>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><MessageSquareQuote className="h-4 w-4"/>Argumentaire Commercial</h4>
                                        <p className="text-sm text-muted-foreground italic border-l-2 pl-4">{generatedConcept.commercialArgument}</p>
                                    </div>

                                    <Button className="w-full" onClick={handleSaveToMenu} disabled={isSaving}>
                                        <NotebookText className="mr-2 h-4 w-4" />
                                        {isSaving ? "Enregistrement..." : "Créer la Fiche Technique & Enregistrer au Menu"}
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
