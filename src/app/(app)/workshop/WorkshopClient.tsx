
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Sparkles, PlusCircle, NotebookText, Clock, Soup, Users, MessageSquareQuote, FileText, Weight, BookCopy, ChevronsRight, Merge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateDishConcept, DishConceptOutput, DishConceptInput } from "@/ai/flows/workshop-flow";
import { useRouter } from "next/navigation";
import { createDishFromWorkshop, createPreparation } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Checkbox } from "@/components/ui/checkbox";

const WORKSHOP_CONCEPT_KEY = 'workshopGeneratedConcept';

export default function WorkshopClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedConcept, setGeneratedConcept] = useState<DishConceptOutput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const initialFormRef = useRef<HTMLFormElement>(null);
    const refinementFormRef = useRef<HTMLFormElement>(null);
    
    const [context, setContext] = useState<DishConceptInput>({});
    const [refinementHistory, setRefinementHistory] = useState<string[]>([]);
    const [prepsToIntegrate, setPrepsToIntegrate] = useState<string[]>([]);


    const handleSubmit = async (instructions: DishConceptInput) => {
        setIsLoading(true);
        setPrepsToIntegrate([]); // Reset selection on new generation/refinement
        
        if (!instructions.refinementHistory || instructions.refinementHistory.length === 0) {
            setGeneratedConcept(null);
            setContext(instructions);
            setRefinementHistory([]);
        }

        try {
            const result = await generateDishConcept(instructions);
            setGeneratedConcept(result);
            if (refinementFormRef.current) {
                refinementFormRef.current.reset();
            }
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
    
    const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const instructions = {
            dishName: formData.get("dishName") as string || undefined,
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
    
    const handleIntegration = (prepNames: string[]) => {
        if (prepNames.length === 0) return;
        const namesString = prepNames.map(name => `'${name}'`).join(' et ');
        const instruction = `Intègre la ou les préparations ${namesString} directement dans la recette principale au lieu de la traiter comme une ou des sous-recettes. Ajoute leurs ingrédients à la liste principale et leurs étapes à la procédure.`;
        const newHistory = [...refinementHistory, instruction];

        const instructions = { ...context, refinementHistory: newHistory, currentRefinement: instruction };
        
        setRefinementHistory(newHistory);
        handleSubmit(instructions);
    }


    const handleSaveToMenu = async () => {
        if (!generatedConcept) return;

        setIsSaving(true);
        try {
            const newDishId = await createDishFromWorkshop(generatedConcept);
            if (newDishId) {
                sessionStorage.setItem(WORKSHOP_CONCEPT_KEY, JSON.stringify(generatedConcept));
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
            toast({ title: "Erreur de sauvegarde", description: "Impossible d'enregistrer le plat.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleNewRecipe = () => {
        setGeneratedConcept(null);
        setContext({});
        setRefinementHistory([]);
        setPrepsToIntegrate([]);
        if (initialFormRef.current) initialFormRef.current.reset();
        if (refinementFormRef.current) refinementFormRef.current.reset();
    };

    const handleCreatePreparation = async (prepName: string, prepDescription: string) => {
        try {
            const newPrepId = await createPreparation({ name: prepName, description: prepDescription });
            toast({ title: "Préparation créée", description: `La fiche pour "${prepName}" est prête à être complétée.` });
            
            const instruction = `La préparation '${prepName}' a été créée et est maintenant disponible. Elle doit désormais apparaître dans la liste 'subRecipes'.`;
            const newHistory = [...refinementHistory, instruction];
            const instructions = { ...context, refinementHistory: newHistory, currentRefinement: instruction };

            setRefinementHistory(newHistory);
            handleSubmit(instructions);

        } catch (error) {
            console.error("Error creating preparation:", error);
            toast({ title: "Erreur", description: "Impossible de créer la fiche de préparation.", variant: "destructive" });
        }
    }


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
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Vos Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form ref={initialFormRef} onSubmit={handleInitialSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Créer à partir d'instructions</h4>
                                    <div>
                                        <Label htmlFor="dishName">Nom du plat (Optionnel)</Label>
                                        <Input id="dishName" name="dishName" placeholder="Ex: Bar de ligne nacré..." disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="mainIngredients">Ingrédients principaux (Optionnel)</Label>
                                        <Input id="mainIngredients" name="mainIngredients" placeholder="Ex: Bar, Orange, Fenouil" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="excludedIngredients">Ingrédients à exclure (Optionnel)</Label>
                                        <Input id="excludedIngredients" name="excludedIngredients" placeholder="Ex: Vin, crème, porc" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="recommendations">Recommandations (Optionnel)</Label>
                                        <Textarea id="recommendations" name="recommendations" placeholder="Ex: Un plat frais, méditerranéen..." disabled={isLoading || !!generatedConcept}/>
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
                                        <Textarea id="rawRecipe" name="rawRecipe" placeholder="Collez ici votre recette complète (ingrédients, étapes...)" rows={5} disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading || !!generatedConcept}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isLoading && !generatedConcept ? "Génération..." : "Générer le concept"}
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
                                        <Textarea id="currentRefinement" name="currentRefinement" placeholder="Ex: Remplace le céleri par de la carotte. Fais une sauce moins riche." disabled={isLoading}/>
                                    </div>
                                    <Button type="submit" className="w-full" variant="outline" disabled={isLoading}>
                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                        {isLoading ? "Affinage..." : "Affiner le concept"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

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
                            {isLoading && !generatedConcept ? (
                                <div className="space-y-4 p-4">
                                    <Skeleton className="w-full h-64 rounded-lg" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <div className="flex gap-4"> <Skeleton className="h-5 w-20" /> <Skeleton className="h-5 w-20" /> <Skeleton className="h-5 w-20" /> </div>
                                    <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-1/2" />
                                </div>
                            ) : generatedConcept ? (
                                <div className="space-y-6">
                                     <div className="relative w-full h-80 rounded-lg overflow-hidden border">
                                        {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Sparkles className="h-8 w-8 animate-spin text-primary"/></div>}
                                        <Image src={generatedConcept.imageUrl} alt={generatedConcept.name} fill style={{ objectFit: 'cover' }} data-ai-hint="artistic food plating" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">{generatedConcept.name}</h3>
                                        <p className="text-muted-foreground mt-1">{generatedConcept.description}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center p-2 rounded-lg border bg-muted/50">
                                        <div className="flex flex-col items-center gap-1"><Clock className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.duration} min</span></div>
                                        <div className="flex flex-col items-center gap-1"><Soup className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.difficulty}</span></div>
                                        <div className="flex flex-col items-center gap-1"><Users className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.portions} portion{generatedConcept.portions > 1 ? 's' : ''}</span></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Weight className="h-4 w-4"/>Ingrédients suggérés</h4>
                                            {generatedConcept.ingredients && generatedConcept.ingredients.length > 0 ? (
                                                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                                                    {generatedConcept.ingredients.map((ing) => (<li key={ing.name}><span className="font-medium text-foreground">{ing.quantity} {ing.unit}</span> - {ing.name}</li>))}
                                                </ul>
                                            ) : ( <p className="text-sm text-muted-foreground pl-5">Aucun ingrédient brut pour l'assemblage.</p> )}
                                        </div>
                                         
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2"><BookCopy className="h-4 w-4" />Sous-Recettes</h4>
                                            <div className="space-y-2">
                                                {generatedConcept.subRecipes.map((prep: string) => <div key={prep}><Badge variant="secondary" className="text-sm">{prep}</Badge></div>)}
                                                
                                                {generatedConcept.newSubRecipes.map((prep) => (
                                                    <div key={prep.name} className="flex items-center gap-2">
                                                        <Checkbox id={`integrate-${prep.name}`} onCheckedChange={(checked) => {
                                                            setPrepsToIntegrate(current => checked ? [...current, prep.name] : current.filter(p => p !== prep.name));
                                                        }}/>
                                                        <label htmlFor={`integrate-${prep.name}`} className="flex items-center gap-2 cursor-pointer">
                                                            <Badge variant="outline" className="text-sm border-dashed">{prep.name}</Badge>
                                                        </label>
                                                         <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCreatePreparation(prep.name, prep.description)} title={`Créer la fiche pour "${prep.name}"`}>
                                                                <PlusCircle className="h-4 w-4 text-primary" />
                                                            </Button>
                                                    </div>
                                                ))}

                                                {prepsToIntegrate.length > 0 && (
                                                    <Button variant="secondary" size="sm" className="mt-2" onClick={() => handleIntegration(prepsToIntegrate)} disabled={isLoading}>
                                                        <Merge className="mr-2 h-4 w-4"/>
                                                        Intégrer la sélection ({prepsToIntegrate.length})
                                                    </Button>
                                                )}

                                                {generatedConcept.subRecipes.length === 0 && generatedConcept.newSubRecipes.length === 0 && (
                                                    <p className="text-sm text-muted-foreground">Aucune sous-recette utilisée.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                     <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4"/>Procédure Technique</h4>
                                        <div className="prose prose-sm max-w-none text-muted-foreground p-4 border rounded-md mt-2">
                                            <MarkdownRenderer text={generatedConcept.procedure_preparation} />
                                            <MarkdownRenderer text={generatedConcept.procedure_cuisson} />
                                            <MarkdownRenderer text={generatedConcept.procedure_service} />
                                        </div>
                                    </div>
                                    
                                    <Separator />

                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><MessageSquareQuote className="h-4 w-4"/>Argumentaire Commercial</h4>
                                        <p className="text-sm text-muted-foreground italic border-l-2 pl-4">{generatedConcept.commercialArgument}</p>
                                    </div>

                                    <Button className="w-full" onClick={handleSaveToMenu} disabled={isSaving}>
                                        <NotebookText className="mr-2 h-4 w-4" />
                                        {isSaving ? "Enregistrement..." : "Créer la Fiche Technique pour Finalisation"}
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
