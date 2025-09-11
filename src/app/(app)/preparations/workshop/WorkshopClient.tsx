
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotebookText, Sparkles, PlusCircle, Clock, Soup, ChevronsRight, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { generateRecipeConcept, RecipeConceptOutput, RecipeConceptInput } from "@/ai/flows/recipe-workshop-flow";
import { useRouter } from "next/navigation";
import { createPreparationFromWorkshop } from "./actions";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Separator } from "@/components/ui/separator";

const PREPARATION_WORKSHOP_CONCEPT_KEY = 'preparationWorkshopGeneratedConcept';

export default function WorkshopClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedConcept, setGeneratedConcept] = useState<RecipeConceptOutput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const initialFormRef = useRef<HTMLFormElement>(null);
    const refinementFormRef = useRef<HTMLFormElement>(null);
    
    const [context, setContext] = useState<RecipeConceptInput>({});
    const [refinementHistory, setRefinementHistory] = useState<string[]>([]);

    const handleSubmit = async (instructions: RecipeConceptInput) => {
        setIsLoading(true);
        
        if (!instructions.refinementHistory || instructions.refinementHistory.length === 0) {
            setGeneratedConcept(null);
            setContext(instructions);
            setRefinementHistory([]);
        }

        try {
            const result = await generateRecipeConcept(instructions);
            setGeneratedConcept(result);
            if (refinementFormRef.current) {
                refinementFormRef.current.reset();
            }
        } catch (error) {
            console.error("Error generating recipe concept:", error);
            toast({
                title: "Erreur de l'IA",
                description: "La génération du concept a échoué. Veuillez réessayer.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const instructions: RecipeConceptInput = {
            type: 'Préparation',
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            mainIngredients: formData.get("mainIngredients") as string || undefined,
            excludedIngredients: formData.get("excludedIngredients") as string || undefined,
            recommendations: formData.get("recommendations") as string || undefined,
            rawRecipe: formData.get("rawRecipe") as string || undefined,
        };
        handleSubmit(instructions);
    }
    
    const handleRefinementSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const currentRefinement = formData.get("currentRefinement") as string;
        if (!currentRefinement) return;
        
        const newHistory = [...refinementHistory, currentRefinement];
        const instructions = { ...context, refinementHistory: newHistory, currentRefinement: currentRefinement };
        
        setRefinementHistory(newHistory);
        handleSubmit(instructions);
    }

    const handleSaveToPreparations = async () => {
        if (!generatedConcept) return;

        setIsSaving(true);
        try {
            const newPrepId = await createPreparationFromWorkshop(generatedConcept);
            if (newPrepId) {
                sessionStorage.setItem(PREPARATION_WORKSHOP_CONCEPT_KEY, JSON.stringify(generatedConcept));
                toast({
                    title: "Préparation enregistrée !",
                    description: `"${generatedConcept.name}" a été ajoutée. Vous pouvez maintenant finaliser la fiche.`,
                });
                router.push(`/preparations/${newPrepId}`);
            } else {
                 throw new Error("L'ID de la préparation n'a pas été retourné après la création.");
            }
        } catch (error) {
            console.error("Error saving preparation from workshop:", error);
            toast({ title: "Erreur de sauvegarde", description: "Impossible d'enregistrer la préparation.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleNewRecipe = () => {
        setGeneratedConcept(null);
        setContext({});
        setRefinementHistory([]);
        if (initialFormRef.current) initialFormRef.current.reset();
        if (refinementFormRef.current) refinementFormRef.current.reset();
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center gap-4">
                 <div className="bg-muted text-muted-foreground rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                    <NotebookText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Atelier des Préparations</h1>
                    <p className="text-muted-foreground">Créez et affinez vos fiches techniques de base avec l'IA.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Vos Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form ref={initialFormRef} onSubmit={handleInitialSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Définir la préparation</h4>
                                    <div>
                                        <Label htmlFor="name">Nom de la préparation</Label>
                                        <Input id="name" name="name" placeholder="Ex: Fond de veau" required disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description (Optionnel)</Label>
                                        <Input id="description" name="description" placeholder="Ex: Base riche pour sauces et jus" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <Separator className="!my-6"/>
                                    <h4 className="font-medium text-sm">Créer à partir d'instructions</h4>
                                    <div>
                                        <Label htmlFor="mainIngredients">Ingrédients principaux (Optionnel)</Label>
                                        <Input id="mainIngredients" name="mainIngredients" placeholder="Ex: Os de veau, carottes, oignons" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="excludedIngredients">Ingrédients à exclure (Optionnel)</Label>
                                        <Input id="excludedIngredients" name="excludedIngredients" placeholder="Ex: Céleri, vin blanc" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="recommendations">Recommandations (Optionnel)</Label>
                                        <Textarea id="recommendations" name="recommendations" placeholder="Ex: Doit être clair et peu salé" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                </div>
                                <div className="relative">
                                  <Separator />
                                  <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">OU</span>
                                </div>
                                <div className="space-y-2">
                                     <h4 className="font-medium text-sm">Importer une recette existante</h4>
                                     <div>
                                        <Label htmlFor="rawRecipe">Recette existante à reformater (Optionnel)</Label>
                                        <Textarea id="rawRecipe" name="rawRecipe" placeholder="Collez ici votre recette complète..." rows={5} disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading || !!generatedConcept}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isLoading && !generatedConcept ? "Génération..." : "Générer la Fiche Technique"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {generatedConcept && (
                         <Card>
                            <CardHeader>
                                <CardTitle>2. Affiner la proposition</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form ref={refinementFormRef} onSubmit={handleRefinementSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="currentRefinement">Instructions d'affinage</Label>
                                        <Textarea id="currentRefinement" name="currentRefinement" placeholder="Ex: Utilise moins d'oignons. Ajoute du thym." disabled={isLoading}/>
                                    </div>
                                    <Button type="submit" className="w-full" variant="outline" disabled={isLoading}>
                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                        {isLoading ? "Affinage..." : "Affiner la fiche"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                </div>
                <div className="lg:col-span-2">
                    <Card className="min-h-[500px] sticky top-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Proposition de l'IA</CardTitle>
                                <CardDescription>Voici la fiche technique générée.</CardDescription>
                            </div>
                             {generatedConcept && (
                                <Button variant="outline" onClick={handleNewRecipe}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Nouvelle Préparation
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isLoading && !generatedConcept ? (
                                <div className="space-y-4 p-4">
                                    <Skeleton className="h-6 w-3/4" />
                                    <div className="flex gap-4"> <Skeleton className="h-5 w-20" /> <Skeleton className="h-5 w-20" /></div>
                                    <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-1/2" />
                                     <div className="pt-6 space-y-2">
                                        <Skeleton className="h-5 w-1/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </div>
                            ) : generatedConcept ? (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold">{generatedConcept.name}</h3>
                                        <p className="text-muted-foreground mt-1">{generatedConcept.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-center p-2 rounded-lg border bg-muted/50">
                                        <div className="flex flex-col items-center gap-1"><Clock className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.duration} min</span></div>
                                        <div className="flex flex-col items-center gap-1"><Soup className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.difficulty}</span></div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Ingrédients Suggérés</h4>
                                        {generatedConcept.ingredients && generatedConcept.ingredients.length > 0 ? (
                                            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                                                {generatedConcept.ingredients.map((ing) => (<li key={ing.name}><span className="font-medium text-foreground">{ing.quantity} {ing.unit}</span> - {ing.name}</li>))}
                                            </ul>
                                        ) : ( <p className="text-sm text-muted-foreground pl-5">Aucun ingrédient brut.</p> )}
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4"/>Procédure Technique</h4>
                                        <div className="prose prose-sm max-w-none text-muted-foreground p-4 border rounded-md mt-2">
                                            <MarkdownRenderer text={generatedConcept.procedure_preparation} />
                                            <MarkdownRenderer text={generatedConcept.procedure_cuisson} />
                                            <MarkdownRenderer text={generatedConcept.procedure_service} />
                                        </div>
                                    </div>

                                    <Button className="w-full" onClick={handleSaveToPreparations} disabled={isSaving}>
                                        <NotebookText className="mr-2 h-4 w-4" />
                                        {isSaving ? "Enregistrement..." : "Créer la Fiche & Finaliser"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-80">
                                    <NotebookText className="h-12 w-12 text-muted-foreground/50" />
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
