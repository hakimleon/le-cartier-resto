"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Sparkles, PlusCircle, NotebookText, Clock, Soup, Users, MessageSquareQuote, FileText, BookCopy, ChevronsRight, Braces, Merge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { generateRecipeConcept, RecipeConceptOutput, RecipeConceptInput } from "@/ai/flows/recipe-workshop-flow";

import { useRouter } from "next/navigation";
// import { createDishFromWorkshop } from "./actions"; // Action à créer plus tard
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

const WORKSHOP_CONCEPT_KEY = 'workshopGeneratedConcept';

// Simule la sortie de l'IA pour le développement de l'UI
const mockConcept: RecipeConceptOutput = {
    type: 'Plat',
    name: "Bar de ligne nacré, purée de fenouil à l'orange",
    description: "Un plat élégant et raffiné où la délicatesse du bar nacré rencontre la douceur anisée du fenouil, réhaussée par une touche d'agrume.",
    imageUrl: "https://picsum.photos/seed/1/1024/768",
    duration: 35,
    difficulty: "Moyen",
    portions: 2,
    ingredients: [
        { name: "Filet de bar", quantity: 300, unit: "g" },
        { name: "Fenouil", quantity: 1, unit: "pièce" },
        { name: "Orange", quantity: 1, unit: "pièce" },
        { name: "Pomme de terre", quantity: 100, unit: "g" },
        { name: "Beurre", quantity: 20, unit: "g" },
        { name: "Huile d'olive", quantity: 10, unit: "ml" },
    ],
    subRecipes: [
        { name: "Fond Blanc de Volaille", quantity: 100, unit: "ml" }
    ],
    procedure_preparation: "### Préparation\n- Lever les filets de bar.\n- Tailler le fenouil et les pommes de terre.",
    procedure_cuisson: "### Cuisson\n- Cuire le bar à l'unilatéral.\n- Confire le fenouil avec le jus d'orange.",
    procedure_service: "### Dressage\n- Dresser la purée en virgule.\n- Déposer délicatement le filet de bar.",
    commercialArgument: "Laissez-vous séduire par la fraîcheur de ce plat iodé, un équilibre parfait entre terre et mer qui réveillera vos papilles.",
    category: 'Plats et Grillades',
};


export default function AtelierClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedConcept, setGeneratedConcept] = useState<RecipeConceptOutput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const initialFormRef = useRef<HTMLFormElement>(null);
    const refinementFormRef = useRef<HTMLFormElement>(null);
    
    const [context, setContext] = useState<RecipeConceptInput>({ type: 'Plat' });
    const [refinementHistory, setRefinementHistory] = useState<string[]>([]);
    const [prepsToIntegrate, setPrepsToIntegrate] = useState<string[]>([]);


    const handleSubmit = async (instructions: RecipeConceptInput) => {
        setIsLoading(true);
        setPrepsToIntegrate([]);
        
        if (!instructions.refinementHistory || instructions.refinementHistory.length === 0) {
            setGeneratedConcept(null);
            setContext(instructions);
            setRefinementHistory([]);
        }

        try {
            // Remplacer par l'appel réel à l'IA
            // const result = await generateRecipeConcept(instructions);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simule une latence réseau
            const result = mockConcept; // Utilisation du mock
            
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
        const instructions: RecipeConceptInput = {
            type: 'Plat',
            name: formData.get("dishName") as string,
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
    
    const handleSaveToMenu = async () => {
        if (!generatedConcept) return;
        // La logique de sauvegarde sera implémentée plus tard
        toast({ title: "Action non disponible", description: "La sauvegarde sera implémentée à la prochaine étape."});
    };
    
    const handleNewRecipe = () => {
        setGeneratedConcept(null);
        setContext({ type: 'Plat' });
        setRefinementHistory([]);
        setPrepsToIntegrate([]);
        if (initialFormRef.current) initialFormRef.current.reset();
        if (refinementFormRef.current) refinementFormRef.current.reset();
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center gap-4">
                 <div className="bg-muted text-muted-foreground rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                    <FlaskConical className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Nouvel Atelier des Plats</h1>
                    <p className="text-muted-foreground">Créez, affinez et conceptualisez vos plats avec l'aide de l'IA.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* --- COLONNE DE GAUCHE --- */}
                <div className="lg:col-span-1 space-y-6 sticky top-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">1. Instructions Initiales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form ref={initialFormRef} onSubmit={handleInitialSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-center text-muted-foreground">Créer à partir d'instructions</h4>
                                    <div>
                                        <Label htmlFor="dishName">Nom ou idée de base *</Label>
                                        <Input id="dishName" name="dishName" placeholder="Ex: Bar de ligne nacré..." disabled={isLoading || !!generatedConcept} required/>
                                    </div>
                                    <div>
                                        <Label htmlFor="mainIngredients">Ingrédients principaux</Label>
                                        <Input id="mainIngredients" name="mainIngredients" placeholder="Ex: Bar, Orange, Fenouil" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="excludedIngredients">Ingrédients à exclure</Label>
                                        <Input id="excludedIngredients" name="excludedIngredients" placeholder="Ex: Vin, crème, porc" disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                    <div>
                                        <Label htmlFor="recommendations">Recommandations</Label>
                                        <Textarea id="recommendations" name="recommendations" placeholder="Ex: Un plat frais, méditerranéen..." disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                </div>
                                <div className="relative py-2">
                                  <Separator />
                                  <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-card px-2 text-xs text-muted-foreground">OU</span>
                                </div>
                                <div className="space-y-2">
                                     <h4 className="font-medium text-sm text-center text-muted-foreground">Importer une recette brute</h4>
                                     <div>
                                        <Label htmlFor="rawRecipe">Coller une recette existante</Label>
                                        <Textarea id="rawRecipe" name="rawRecipe" placeholder="Collez ici votre recette complète (ingrédients, étapes...)" rows={5} disabled={isLoading || !!generatedConcept}/>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading || !!generatedConcept}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isLoading && !generatedConcept ? "Génération en cours..." : "Générer le Concept"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {generatedConcept && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">2. Affiner la Proposition</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form ref={refinementFormRef} onSubmit={handleRefinementSubmit} className="space-y-4">
                                     {refinementHistory.length > 0 && (
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p className="font-medium text-foreground">Historique :</p>
                                            <ul className="list-disc list-inside">
                                                {refinementHistory.map((h, i) => <li key={i}>{h}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="currentRefinement">Instruction d'affinage</Label>
                                        <Textarea id="currentRefinement" name="currentRefinement" placeholder="Ex: Remplace le céleri par de la carotte. Fais une sauce moins riche." disabled={isLoading}/>
                                    </div>
                                    <Button type="submit" className="w-full" variant="outline" disabled={isLoading}>
                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                        {isLoading ? "Affinage en cours..." : "Affiner le Concept"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* --- COLONNE DE DROITE --- */}
                <div className="lg:col-span-2">
                    <Card className="min-h-[600px] sticky top-8">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Fiche Technique Dynamique</CardTitle>
                                <CardDescription>Le résultat de l'IA apparaîtra et évoluera ici.</CardDescription>
                            </div>
                             {generatedConcept && (
                                <Button variant="outline" onClick={handleNewRecipe}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Nouveau Plat
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-6 p-4">
                                    <Skeleton className="w-full h-80 rounded-lg" />
                                    <Skeleton className="h-8 w-3/4" />
                                    <div className="flex gap-4"> <Skeleton className="h-6 w-24" /> <Skeleton className="h-6 w-24" /> <Skeleton className="h-6 w-24" /> </div>
                                    <Separator/>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2"><Skeleton className="h-5 w-32" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-full" /></div>
                                        <div className="space-y-2"><Skeleton className="h-5 w-32" /> <Skeleton className="h-4 w-full" /></div>
                                    </div>
                                </div>
                            ) : generatedConcept ? (
                                <div className="space-y-6">
                                     {generatedConcept.imageUrl && (
                                        <div className="relative w-full h-80 rounded-lg overflow-hidden border">
                                            <Image src={generatedConcept.imageUrl} alt={generatedConcept.name} fill style={{ objectFit: 'cover' }} data-ai-hint="artistic food plating" />
                                        </div>
                                     )}
                                    <div>
                                        <h3 className="text-2xl font-bold">{generatedConcept.name}</h3>
                                        <p className="text-muted-foreground mt-1">{generatedConcept.description}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center p-2 rounded-lg border bg-muted/50">
                                        <div className="flex flex-col items-center gap-1"><Clock className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.duration} min</span></div>
                                        <div className="flex flex-col items-center gap-1"><Soup className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.difficulty}</span></div>
                                        {generatedConcept.portions && <div className="flex flex-col items-center gap-1"><Users className="h-5 w-5 text-muted-foreground"/><span className="text-sm font-semibold">{generatedConcept.portions} portion{generatedConcept.portions! > 1 ? 's' : ''}</span></div>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">Ingrédients Bruts</h4>
                                            {generatedConcept.ingredients && generatedConcept.ingredients.length > 0 ? (
                                                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                                                    {generatedConcept.ingredients.map((ing) => (<li key={ing.name}><span className="font-medium text-foreground">{ing.quantity} {ing.unit}</span> - {ing.name}</li>))}
                                                </ul>
                                            ) : ( <p className="text-sm text-muted-foreground pl-5">Aucun ingrédient brut nécessaire.</p> )}
                                        </div>
                                         
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2"><BookCopy className="h-4 w-4" />Sous-Recettes</h4>
                                             {generatedConcept.subRecipes.length === 0 && (
                                                <p className="text-sm text-muted-foreground">Aucune sous-recette utilisée.</p>
                                            )}
                                            <div className="space-y-2">
                                                {generatedConcept.subRecipes.map((prep) => <div key={prep.name}><Badge variant="secondary" className="text-sm">{prep.quantity} {prep.unit} - {prep.name}</Badge></div>)}
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

                                    {generatedConcept.commercialArgument && (
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2"><MessageSquareQuote className="h-4 w-4"/>Argumentaire Commercial</h4>
                                            <p className="text-sm text-muted-foreground italic border-l-2 pl-4">{generatedConcept.commercialArgument}</p>
                                        </div>
                                    )}

                                    <Button className="w-full" onClick={handleSaveToMenu} disabled={isSaving}>
                                        <NotebookText className="mr-2 h-4 w-4" />
                                        {isSaving ? "Enregistrement..." : "Créer la Fiche Technique pour Finalisation"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                    <FlaskConical className="h-16 w-16 text-muted-foreground/30" />
                                    <p className="mt-4 text-lg font-medium text-muted-foreground">Votre concept apparaîtra ici</p>
                                    <p className="text-sm text-muted-foreground/80">Utilisez le formulaire pour commencer à créer.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
