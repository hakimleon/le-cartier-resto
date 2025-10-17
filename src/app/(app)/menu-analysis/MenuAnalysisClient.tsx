"use client";

import { useState, useEffect, useMemo, useTransition } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Recipe, Ingredient, Preparation, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { getConversionFactor, computeIngredientCost } from '@/utils/unitConverter';
import type { AnalysisInput, AIResults, PlanningTask, DishAnalysis } from '@/ai/flows/menu-analysis-flow';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BrainCircuit, ChefHat, Loader2, FileText, BarChart3, ListOrdered } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MarkdownRenderer from '@/components/MarkdownRenderer';

type EnrichedRecipe = Recipe & { 
    foodCost?: number;
    costPerPortion?: number;
    grossMargin?: number;
    yieldPerMin?: number;
    foodCostPercentage?: number;
};

type MutualizedPreparation = {
    id: string;
    name: string;
    dishCount: number;
    dishes: string[];
    frequency: string;
}

export default function MenuAnalysisClient() {
    const [dishes, setDishes] = useState<EnrichedRecipe[]>([]);
    const [mutualisations, setMutualisations] = useState<MutualizedPreparation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAnalyzing, startAnalysis] = useTransition();
    const [analysisResults, setAnalysisResults] = useState<AIResults | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        const calculateAllCosts = async () => {
            if (!isFirebaseConfigured) {
                setError("La configuration de Firebase est manquante.");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const [
                    recipesSnap,
                    ingredientsSnap,
                    preparationsSnap,
                    garnishesSnap,
                    recipeIngsSnap,
                    recipePrepsSnap
                ] = await Promise.all([
                    getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
                    getDocs(collection(db, "ingredients")),
                    getDocs(collection(db, "preparations")),
                    getDocs(collection(db, "garnishes")),
                    getDocs(collection(db, "recipeIngredients")),
                    getDocs(collection(db, "recipePreparationLinks")),
                ]);

                const activeRecipes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
                const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Ingredient]));
                
                const allPrepsAndGarnishesList = [
                    ...preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation)),
                    ...garnishesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation))
                ];
                const allPrepsAndGarnishes = new Map(allPrepsAndGarnishesList.map(p => [p.id, p]));
                
                const recipeIngredientLinks = recipeIngsSnap.docs.map(d => d.data() as RecipeIngredientLink);
                const recipePreparationLinks = recipePrepsSnap.docs.map(d => d.data() as RecipePreparationLink);
                
                const linksByParentId = new Map<string, { ingredients: RecipeIngredientLink[], preparations: RecipePreparationLink[] }>();
                
                recipeIngredientLinks.forEach(link => {
                    if (!linksByParentId.has(link.recipeId)) linksByParentId.set(link.recipeId, { ingredients: [], preparations: [] });
                    linksByParentId.get(link.recipeId)!.ingredients.push(link);
                });
                recipePreparationLinks.forEach(link => {
                    if (!linksByParentId.has(link.parentRecipeId)) linksByParentId.set(link.parentRecipeId, { ingredients: [], preparations: [] });
                    linksByParentId.get(link.parentRecipeId)!.preparations.push(link);
                });

                const costsByPrepId = new Map<string, number>();
                const sortedPreps = (() => {
                    const deps = new Map<string, string[]>();
                    const order: string[] = [];
                    const permMark = new Set<string>();
                    const tempMark = new Set<string>();

                    allPrepsAndGarnishesList.forEach(p => {
                        const prepLinks = linksByParentId.get(p.id!)?.preparations || [];
                        deps.set(p.id!, prepLinks.map(l => l.childPreparationId));
                    });

                    function visit(prepId: string) {
                        if (!prepId || !allPrepsAndGarnishes.has(prepId)) return;
                        if (permMark.has(prepId)) return;
if (tempMark.has(prepId)) { console.warn(`Dépendance circulaire détectée pour la préparation ID: '${prepId}'`); return; }
                        
                        tempMark.add(prepId);
                        (deps.get(prepId) || []).forEach(visit);
                        tempMark.delete(prepId);
                        permMark.add(prepId);
                        order.push(prepId);
                    }

                    allPrepsAndGarnishesList.forEach(p => p.id && visit(p.id));
                    return order;
                })();

                for (const prepId of sortedPreps) {
                    const prep = allPrepsAndGarnishes.get(prepId);
                    if (!prep) continue;
                    
                    let prepTotalCost = 0;
                    const links = linksByParentId.get(prepId);

                    for (const ingLink of links?.ingredients || []) {
                        const ingData = allIngredients.get(ingLink.ingredientId);
                        if (ingData) {
                            prepTotalCost += computeIngredientCost(ingData, ingLink.quantity, ingLink.unitUse).cost;
                        }
                    }
                    for (const subPrepLink of links?.preparations || []) {
                        const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                        const subPrepCostPerUnit = costsByPrepId.get(subPrepLink.childPreparationId) || 0;
                        if (subPrepData) {
                             const quantityInProductionUnit = subPrepLink.quantity * getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit || 'g', subPrepData);
                             prepTotalCost += quantityInProductionUnit * subPrepCostPerUnit;
                        }
                    }
                    costsByPrepId.set(prepId, (prepTotalCost / (prep.productionQuantity || 1)) || 0);
                }

                const enrichedDishes: EnrichedRecipe[] = activeRecipes.map(recipe => {
                    let dishTotalCost = 0;
                    const links = linksByParentId.get(recipe.id!);
                    
                    for (const ingLink of links?.ingredients || []) {
                        const ingData = allIngredients.get(ingLink.ingredientId);
                        if (ingData) {
                            dishTotalCost += computeIngredientCost(ingData, ingLink.quantity, ingLink.unitUse).cost;
                        }
                    }
                    for (const subPrepLink of links?.preparations || []) {
                        const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                        const subPrepCostPerUnit = costsByPrepId.get(subPrepLink.childPreparationId) || 0;
                        if(subPrepData) {
                             const quantityInProductionUnit = subPrepLink.quantity * getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit || 'g', subPrepData);
                            dishTotalCost += quantityInProductionUnit * subPrepCostPerUnit;
                        }
                    }

                    const portions = recipe.portions || 1;
                    const costPerPortion = dishTotalCost / portions;
                    const price = recipe.price || 0;
                    const tvaRate = recipe.tvaRate || 10;
                    const priceHT = price > 0 ? price / (1 + tvaRate / 100) : 0;
                    const foodCostPercentage = price > 0 ? (costPerPortion / price) * 100 : 0;
                    const grossMargin = priceHT > 0 ? priceHT - costPerPortion : 0;
                    const duration = recipe.duration || 0;
                    const yieldPerMin = duration > 0 ? grossMargin / duration : 0;
                    
                    return { ...recipe, foodCost: dishTotalCost, costPerPortion, grossMargin, yieldPerMin, foodCostPercentage };
                });
                
                setDishes(enrichedDishes);

                const prepUsageMap = new Map<string, { name: string; dishes: string[] }>();
                activeRecipes.forEach(recipe => {
                    const links = linksByParentId.get(recipe.id!)?.preparations || [];
                    links.forEach(link => {
                        const prep = allPrepsAndGarnishes.get(link.childPreparationId);
                        if (prep) {
                            if (!prepUsageMap.has(prep.id!)) {
                                prepUsageMap.set(prep.id!, { name: prep.name, dishes: [] });
                            }
                            prepUsageMap.get(prep.id!)!.dishes.push(recipe.name);
                        }
                    });
                });

                const mutualisationsData: MutualizedPreparation[] = Array.from(prepUsageMap.entries())
                    .map(([id, data]) => ({
                        id,
                        ...data,
                        dishCount: data.dishes.length,
                        frequency: data.dishes.length > 3 ? 'Élevée' : data.dishes.length > 1 ? 'Moyenne' : 'Faible',
                    }))
                    .filter(item => item.dishCount > 1)
                    .sort((a,b) => b.dishCount - a.dishCount);

                setMutualisations(mutualisationsData);

            } catch (e: any) {
                console.error("Failed to calculate costs:", e);
                setError("Impossible de calculer les coûts. " + e.message);
            } finally {
                setIsLoading(false);
            }
        };

        calculateAllCosts();
    }, []);

    const handleAnalysis = () => {
        setAnalysisResults(null);
        setAnalysisError(null);
        startAnalysis(async () => {
            const totalDuration = dishes.reduce((acc, dish) => acc + (dish.duration || 0), 0);

            const analysisInput: AnalysisInput = {
                summary: {
                    totalDishes: dishes.length,
                    averageDuration: dishes.length > 0 ? totalDuration / dishes.length : 0,
                    categoryCount: dishes.reduce((acc, dish) => {
                        acc[dish.category] = (acc[dish.category] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>),
                },
                production: dishes.map(d => ({
                    id: d.id!,
                    name: d.name,
                    category: d.category,
                    duration: d.duration || 0,
                    duration_breakdown: d.duration_breakdown || { mise_en_place: 0, cuisson: 0, envoi: 0 },
                    foodCost: d.costPerPortion || 0,
                    grossMargin: d.grossMargin || 0,
                    yieldPerMin: d.yieldPerMin || 0,
                    price: d.price || 0,
                    mode_preparation: d.mode_preparation,
                })),
                mutualisations: mutualisations,
            };

            try {
                const res = await fetch('/api/menu-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(analysisInput),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Erreur API (${res.status})`);
                }

                const result = await res.json();
                if (result.error) {
                    setAnalysisError(result.error);
                } else {
                    setAnalysisResults(result);
                }
            } catch (e: any) {
                console.error(e);
                setAnalysisError(e.message);
            }
        });
    };

    const getPriorityBadge = (priority: 'Urgent' | 'Moyen' | 'Bon') => {
        switch(priority) {
            case 'Urgent': return <Badge variant="destructive">Urgent</Badge>;
            case 'Moyen': return <Badge className="bg-orange-500 text-white">Moyen</Badge>;
            case 'Bon': return <Badge className="bg-green-500 text-white">Bon</Badge>;
            default: return <Badge variant="secondary">{priority}</Badge>;
        }
    }


    const renderSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Array.from({length: 5}).map((_,i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                               {Array.from({length: 5}).map((_,j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse Stratégique du Menu</h1>
                <p className="text-muted-foreground">Utilisez l'IA pour obtenir des recommandations et optimiser votre rentabilité.</p>
            </header>

            {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de Chargement des Données</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Données de Production et Rentabilité</CardTitle>
                        <CardDescription>Voici les données qui seront envoyées à l'IA pour analyse. Cliquez sur le bouton ci-dessous pour lancer l'analyse.</CardDescription>
                    </CardHeader>
                    {isLoading ? renderSkeleton() : (
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plat</TableHead>
                                        <TableHead>Catégorie</TableHead>
                                        <TableHead className="text-right">Prix de Vente</TableHead>
                                        <TableHead className="text-right">Food Cost % (sur TTC)</TableHead>
                                        <TableHead className="text-right">Temps Service (min)</TableHead>
                                        <TableHead className="text-right">Rendement (DZD/min)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dishes.length > 0 ? (
                                        dishes.map(dish => (
                                            <TableRow key={dish.id}>
                                                <TableCell className="font-medium">{dish.name}</TableCell>
                                                <TableCell>{dish.category}</TableCell>
                                                <TableCell className="text-right">{dish.price.toFixed(2)} DZD</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {dish.foodCostPercentage !== undefined ? `${dish.foodCostPercentage.toFixed(1)} %` : 'Calcul...'}
                                                </TableCell>
                                                <TableCell className="text-right">{dish.duration || 0} min</TableCell>
                                                <TableCell className="text-right font-bold">{dish.yieldPerMin?.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucun plat actif à analyser.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    )}
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Lancer l'Analyse IA</CardTitle>
                        <CardDescription>Cliquez sur le bouton pour envoyer les données à l'IA et recevoir un rapport d'optimisation complet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleAnalysis} disabled={isAnalyzing || isLoading || dishes.length === 0}>
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                            {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse IA"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {isAnalyzing && (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">L'IA analyse votre menu... Veuillez patienter.</p>
                </div>
            )}
            
            {analysisError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur d'Analyse IA</AlertTitle>
                    <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
            )}

            {analysisResults && (
                <div className="space-y-6">
                     <h2 className="text-xl font-bold tracking-tight text-muted-foreground pt-4 border-t">Résultats de l'Analyse IA</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText />Recommandations Stratégiques Globales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MarkdownRenderer text={analysisResults.strategic_recommendations} />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 />Réingénierie des Plats</CardTitle>
                             <CardDescription>Analyse de chaque plat pour identifier les priorités d'optimisation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plat</TableHead>
                                        <TableHead>Priorité</TableHead>
                                        <TableHead>Suggestion</TableHead>
                                        <TableHead>Impact Attendu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analysisResults.dish_reengineering.map(dish => (
                                        <TableRow key={dish.id}>
                                            <TableCell className="font-medium">{dish.name}</TableCell>
                                            <TableCell>{getPriorityBadge(dish.priority)}</TableCell>
                                            <TableCell>{dish.suggestion}</TableCell>
                                            <TableCell>{dish.impact}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ListOrdered />Suggestions de Planning de Production</CardTitle>
                             <CardDescription>Un exemple de planning optimisé pour la mise en place du matin.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Heure</TableHead>
                                        <TableHead>Poste</TableHead>
                                        <TableHead>Tâche</TableHead>
                                        <TableHead>Durée (min)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analysisResults.production_planning_suggestions.map((task, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono">{task.heure}</TableCell>
                                            <TableCell>{task.poste}</TableCell>
                                            <TableCell className="font-medium">{task.tache}</TableCell>
                                            <TableCell>{task.duree}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
