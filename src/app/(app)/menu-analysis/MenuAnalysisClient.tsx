
"use client";

import { useState, useTransition, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ai } from '@/ai/genkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, Clock, Flame, Recycle, Sparkles, BrainCircuit, Loader2, CalendarClock, Target, Lightbulb } from 'lucide-react';
import type { Recipe, Ingredient, Preparation, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { getAIRecommendations } from './actions';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { getConversionFactor, computeIngredientCost } from '@/utils/unitConverter';
import { Skeleton } from '@/components/ui/skeleton';

// Data structures for analysis
export type SummaryData = {
    totalDishes: number;
    averageDuration: number;
    categoryCount: Record<string, number>;
};

export type ProductionData = {
    id: string;
    name: string;
    category: string;
    duration: number; 
    duration_breakdown: { mise_en_place: number; cuisson: number; envoi: number; };
    foodCost: number;
    grossMargin: number;
    yieldPerMin: number;
    price: number;
    mode_preparation?: 'avance' | 'minute' | 'mixte';
};

export type MutualisationData = {
  id: string;
  name: string;
  dishCount: number;
  dishes: string[];
  frequency: 'Quotidienne' | 'Fréquente' | 'Occasionnelle';
}

export type PlanningTask = {
    heure: string;
    poste: string;
    tache: string;
    duree: number;
    priorite: number;
}

export type PerformanceData = {
    commonPreparationsCount: number;
    averageMargin: number;
    averageMepTime: number;
    complexityRate: number;
    menuBalance: Record<string, number>;
};

interface DishReengineering {
  id: string;
  name: string;
  priority: 'Urgent' | 'Moyen' | 'Bon';
  suggestion: string;
  impact: string;
}

interface AIResults {
    strategic_recommendations: string;
    dish_reengineering: DishReengineering[];
    production_planning_suggestions: PlanningTask[];
}


export default function MenuAnalysisClient() {
    const [isAnalyzingAI, startAIAnalysisTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [productionData, setProductionData] = useState<ProductionData[]>([]);
    const [mutualisationData, setMutualisationData] = useState<MutualisationData[]>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    
    const [aiResults, setAiResults] = useState<AIResults | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const performAnalysis = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Fetch all data sequentially from the client
                const recipesSnap = await getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif")));
                const ingredientsSnap = await getDocs(collection(db, "ingredients"));
                const preparationsSnap = await getDocs(collection(db, "preparations"));
                const garnishesSnap = await getDocs(collection(db, "garnishes"));
                const recipeIngsSnap = await getDocs(collection(db, "recipeIngredients"));
                const recipePrepsSnap = await getDocs(collection(db, "recipePreparationLinks"));

                const rawActiveRecipes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
                const rawIngredients = ingredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
                const rawPreparations = preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));
                const rawGarnishes = garnishesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));
                const rawRecipeIngredients = recipeIngsSnap.docs.map(doc => doc.data() as RecipeIngredientLink);
                const rawRecipePreps = recipePrepsSnap.docs.map(doc => doc.data() as RecipePreparationLink);
                
                // === Start of calculation logic moved from server ===
                const allIngredients = new Map(rawIngredients.map(doc => [doc.id!, doc]));
                const allPrepsAndGarnishesList = [...rawPreparations, ...rawGarnishes];
                const allPrepsAndGarnishes = new Map(allPrepsAndGarnishesList.map(p => [p.id!, p]));
                
                const allRecipeIngredientsMap = new Map<string, RecipeIngredientLink[]>();
                rawRecipeIngredients.forEach(link => {
                    if (!allRecipeIngredientsMap.has(link.recipeId)) allRecipeIngredientsMap.set(link.recipeId, []);
                    allRecipeIngredientsMap.get(link.recipeId)!.push(link);
                });

                const allRecipePrepsMap = new Map<string, RecipePreparationLink[]>();
                rawRecipePreps.forEach(link => {
                    if (!allRecipePrepsMap.has(link.parentRecipeId)) allRecipePrepsMap.set(link.parentRecipeId, []);
                    allRecipePrepsMap.get(link.parentRecipeId)!.push(link);
                });

                const prepCosts = new Map<string, number>();
                const weightedDurationCache = new Map<string, number>();

                 const getWeightedDuration = (itemId: string, itemType: 'recipe' | 'prep', visited = new Set<string>()): number => {
                    if (visited.has(itemId)) {
                        console.warn(`Circular dependency detected and broken at item ID: ${itemId}`);
                        return 0;
                    }
                    if(weightedDurationCache.has(itemId)){ return weightedDurationCache.get(itemId)!; }
                    visited.add(itemId);
                    const item = itemType === 'recipe' ? rawActiveRecipes.find(r => r.id === itemId) : allPrepsAndGarnishes.get(itemId);
                    if (!item) {
                        visited.delete(itemId);
                        return 0;
                    }
                    let weightedTime = 0;
                    const mode = item.mode_preparation || (item.type === 'Plat' ? 'minute' : 'avance');
                    const itemDuration = Number(item.duration) || 0;
                    if (mode === 'minute') weightedTime += itemDuration;
                    else if (mode === 'mixte') weightedTime += itemDuration * 0.5;
                    const subPreps = allRecipePrepsMap.get(item.id!) || [];
                    for (const subPrepLink of subPreps) { weightedTime += getWeightedDuration(subPrepLink.childPreparationId, 'prep', visited); }
                    visited.delete(itemId);
                    weightedDurationCache.set(itemId, weightedTime);
                    return weightedTime;
                };

                const sortedPrepsOrder = (() => {
                    const deps = new Map<string, string[]>();
                    const order: string[] = [];
                    const permMark = new Set<string>();
                    const tempMark = new Set<string>();
                    allPrepsAndGarnishesList.forEach(p => { if(p.id) deps.set(p.id, (allRecipePrepsMap.get(p.id) || []).map(l => l.childPreparationId)); });
                    function visit(prepId: string) {
                        if (permMark.has(prepId)) return;
                        if (tempMark.has(prepId)) { return; }
                        if (!allPrepsAndGarnishes.has(prepId)) return;
                        tempMark.add(prepId);
                        (deps.get(prepId) || []).forEach(visit);
                        tempMark.delete(prepId);
                        permMark.add(prepId);
                        order.push(prepId);
                    }
                    allPrepsAndGarnishesList.forEach(p => p.id && visit(p.id));
                    return order;
                })();

                for (const prepId of sortedPrepsOrder) {
                    const prep = allPrepsAndGarnishes.get(prepId);
                    if (!prep) continue;
                    let totalCost = 0;
                    const directIngredients = allRecipeIngredientsMap.get(prepId) || [];
                    for (const ingLink of directIngredients) {
                        const ingData = allIngredients.get(ingLink.ingredientId);
                        if (ingData) totalCost += computeIngredientCost(ingData, Number(ingLink.quantity) || 0, ingLink.unitUse).cost;
                    }
                    const subPreps = allRecipePrepsMap.get(prepId) || [];
                    for (const subPrepLink of subPreps) {
                        const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                        const costPerUnit = prepCosts.get(subPrepLink.childPreparationId) || 0;
                        if (subPrepData) {
                            const factor = getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit!, subPrepData);
                            totalCost += (Number(subPrepLink.quantity) * factor) * costPerUnit;
                        }
                    }
                    const productionQuantity = Number(prep.productionQuantity) || 1;
                    const costPerProductionUnit = productionQuantity > 0 ? totalCost / productionQuantity : 0;
                    prepCosts.set(prepId, isNaN(costPerProductionUnit) ? 0 : costPerProductionUnit);
                }

                const prepUsageCount = new Map<string, { name: string, dishes: string[] }>();
                const tempProductionData: ProductionData[] = [];
                for (const recipe of rawActiveRecipes) {
                    let dishTotalCost = 0;
                    (allRecipeIngredientsMap.get(recipe.id!) || []).forEach(link => {
                        const ingData = allIngredients.get(link.ingredientId);
                        if(ingData) dishTotalCost += computeIngredientCost(ingData, Number(link.quantity) || 0, link.unitUse).cost;
                    });
                    (allRecipePrepsMap.get(recipe.id!) || []).forEach(link => {
                        const prepData = allPrepsAndGarnishes.get(link.childPreparationId);
                        const costPerUnit = prepCosts.get(link.childPreparationId) || 0;
                        if (prepData) {
                            if (!prepUsageCount.has(prepData.id!)) prepUsageCount.set(prepData.id!, { name: prepData.name, dishes: [] });
                            prepUsageCount.get(prepData.id!)!.dishes.push(recipe.name);
                            const factor = getConversionFactor(link.unitUse, prepData.productionUnit!, prepData);
                            dishTotalCost += (Number(link.quantity) * factor) * costPerUnit;
                        }
                    });
                    const foodCostPerPortion = (Number(recipe.portions) || 1) > 0 ? dishTotalCost / (Number(recipe.portions) || 1) : 0;
                    const price = Number(recipe.price) || 0;
                    const tvaRate = Number(recipe.tvaRate) || 10;
                    const priceHT = price / (1 + tvaRate / 100);
                    const grossMargin = priceHT - foodCostPerPortion;
                    const weightedDuration = getWeightedDuration(recipe.id!, 'recipe');
                    const yieldPerMin = weightedDuration > 0 ? grossMargin / weightedDuration : 0;
                    let breakdown = recipe.duration_breakdown;
                    if (!breakdown) {
                        const d = Number(recipe.duration) || 0;
                        breakdown = d <= 15 ? { mise_en_place: 5, cuisson: d > 5 ? d - 5 : 0, envoi: 2 } : d <= 45 ? { mise_en_place: d * 0.2, cuisson: d * 0.7, envoi: d * 0.1 } : { mise_en_place: d * 0.6, cuisson: d * 0.3, envoi: d * 0.1 };
                    }
                    tempProductionData.push({ id: recipe.id!, name: recipe.name, category: recipe.category, duration: weightedDuration, duration_breakdown: breakdown, foodCost: foodCostPerPortion, grossMargin: grossMargin, yieldPerMin: yieldPerMin, price: price, mode_preparation: recipe.mode_preparation });
                }
                setProductionData(tempProductionData);
                
                const tempSummary: SummaryData = { totalDishes: rawActiveRecipes.length, averageDuration: tempProductionData.reduce((acc, p) => acc + p.duration, 0) / (tempProductionData.length || 1), categoryCount: rawActiveRecipes.reduce((acc, doc) => { const cat = doc.category || 'Non classé'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>)};
                setSummary(tempSummary);
                
                const tempMutualisations: MutualisationData[] = [];
                for (const [id, data] of prepUsageCount.entries()) {
                    if (data.dishes.length >= 2) {
                        let freq: MutualisationData['frequency'] = 'Occasionnelle';
                        if (data.dishes.length >= 4) freq = 'Quotidienne';
                        else if (data.dishes.length >= 2) freq = 'Fréquente';
                        tempMutualisations.push({ id, name: data.name, dishCount: data.dishes.length, dishes: data.dishes, frequency: freq });
                    }
                }
                setMutualisationData(tempMutualisations.sort((a, b) => b.dishCount - a.dishCount));

                const totalGrossMargin = tempProductionData.reduce((acc, p) => acc + p.grossMargin, 0);
                const totalMepTime = tempProductionData.reduce((acc, p) => acc + p.duration_breakdown.mise_en_place, 0);
                const difficultDishes = rawActiveRecipes.filter(r => r.difficulty === 'Difficile').length;
                const tempPerformanceData: PerformanceData = { commonPreparationsCount: tempMutualisations.length, averageMargin: totalGrossMargin / (tempProductionData.length || 1), averageMepTime: totalMepTime / (tempProductionData.length || 1), complexityRate: (difficultDishes / (rawActiveRecipes.length || 1)) * 100, menuBalance: tempSummary.categoryCount };
                setPerformanceData(tempPerformanceData);
                // === End of calculation logic ===

            } catch (e: any) {
                console.error("Error analyzing menu on client:", e);
                setError(e.message || "Une erreur inconnue est survenue lors de l'analyse.");
            } finally {
                setIsLoading(false);
            }
        };

        performAnalysis();
    }, []);
    
    const handleAIAnalysis = () => {
        if (!summary || !productionData || !mutualisationData) return;
        setAiResults(null);
        startAIAnalysisTransition(async () => {
            const result = await getAIRecommendations({ summary, production: productionData, mutualisations: mutualisationData });
            if ('error' in result) {
                 setAiResults(null);
                 toast({ title: "Erreur d'analyse IA", description: result.error, variant: "destructive", });
                 console.error(result.error);
            } else {
                 setAiResults(result);
            }
        });
    }

    const getYieldBadgeVariant = (yieldPerMin: number): "default" | "secondary" | "destructive" => {
        if (yieldPerMin > 100) return "default";
        if (yieldPerMin > 50) return "secondary";
        return "destructive";
    }
    
    const getReengineeringPriorityBadge = (priority: 'Urgent' | 'Moyen' | 'Bon') => {
        switch (priority) {
            case 'Urgent': return <Badge variant="destructive">🔴 Urgent</Badge>;
            case 'Moyen': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">🟠 Moyen</Badge>;
            case 'Bon': return <Badge variant="secondary" className="bg-green-100 text-green-800">🟢 Bon</Badge>;
            default: return <Badge variant="outline">{priority}</Badge>;
        }
    }
    
    if (error) {
        return (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de Chargement des Données</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (isLoading || !summary || !performanceData) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-48" />
                </div>
                 <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Loader2 className="h-10 w-10 text-primary mb-4 animate-spin"/>
                    <p className="font-semibold">Chargement et analyse des données du menu...</p>
                    <p className="text-sm text-muted-foreground">Cette opération peut prendre un moment.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }
    
    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu</h1>
                    <p className="text-muted-foreground">Synthèse, production et rentabilité de vos plats actifs.</p>
                </div>
                 <Button onClick={handleAIAnalysis} disabled={isAnalyzingAI}>
                    {isAnalyzingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isAnalyzingAI ? 'Analyse en cours...' : "Analyser avec l'IA"}
                </Button>
            </header>

            {isAnalyzingAI && !aiResults && (
                <Card className="flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <BrainCircuit className="h-10 w-10 text-primary mb-4"/>
                    <p className="font-semibold">L'IA analyse votre menu...</p>
                    <p className="text-sm text-muted-foreground">Calcul des optimisations, rentabilité et points de friction.</p>
                </Card>
            )}

            {aiResults && (
                 <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary"><Sparkles /> Recommandations Stratégiques</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="prose prose-sm max-w-none text-muted-foreground"><MarkdownRenderer text={aiResults.strategic_recommendations} /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb /> Réingénierie des Plats</CardTitle>
                            <CardDescription>Suggestions d'optimisation pour les plats, classées par priorité.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Plat</TableHead>
                                <TableHead>Priorité</TableHead>
                                <TableHead>Suggestion d'Action</TableHead>
                                <TableHead>Impact Attendu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aiResults.dish_reengineering && aiResults.dish_reengineering.length > 0 ? (
                                aiResults.dish_reengineering.map((dish) => (
                                    <TableRow key={dish.id}>
                                    <TableCell className="font-medium">{dish.name}</TableCell>
                                    <TableCell>{getReengineeringPriorityBadge(dish.priority)}</TableCell>
                                    <TableCell>{dish.suggestion}</TableCell>
                                    <TableCell className="font-semibold text-green-600">{dish.impact}</TableCell>
                                    </TableRow>
                                ))
                                ) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucune suggestion spécifique pour les plats.</TableCell></TableRow>
                                )}
                            </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarClock /> Planning de Production Suggéré</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Heure</TableHead>
                                       <TableHead>Poste</TableHead>
                                       <TableHead>Tâche</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {aiResults.production_planning_suggestions && aiResults.production_planning_suggestions.length > 0 ? aiResults.production_planning_suggestions.map((task, index) => (
                                       <TableRow key={index}>
                                           <TableCell className="font-medium">{task.heure}</TableCell>
                                           <TableCell><Badge variant="outline">{task.poste}</Badge></TableCell>
                                           <TableCell>{task.tache}</TableCell>
                                       </TableRow>
                                   )) : (
                                      <TableRow>
                                           <TableCell colSpan={3} className="h-24 text-center">Le planning n'a pas pu être généré.</TableCell>
                                       </TableRow>
                                   )}
                               </TableBody>
                           </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader> <CardTitle className="flex items-center gap-2"><BarChart3 />Résumé du Menu</CardTitle> </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Card className="p-4"><CardDescription>Plats Actifs</CardDescription><p className="text-2xl font-bold">{summary.totalDishes}</p></Card>
                        <Card className="p-4"><CardDescription>Durée Pondérée Moyenne</CardDescription><p className="text-2xl font-bold">{summary.averageDuration.toFixed(0)} <span className="text-base text-muted-foreground">min</span></p></Card>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader> <CardTitle className="flex items-center gap-2"><Target />Performance &amp; KPIs</CardTitle> </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Card className="p-4"><CardDescription>Préparations Communes</CardDescription><p className="text-2xl font-bold">{performanceData.commonPreparationsCount}</p></Card>
                        <Card className="p-4"><CardDescription>Marge Brute Moyenne</CardDescription><p className="text-2xl font-bold">{performanceData.averageMargin.toFixed(2)} <span className="text-base text-muted-foreground">DZD</span></p></Card>
                        <Card className="p-4"><CardDescription>Tps Moyen MEP</CardDescription><p className="text-2xl font-bold">{performanceData.averageMepTime.toFixed(0)} <span className="text-base text-muted-foreground">min</span></p></Card>
                        <Card className="p-4"><CardDescription>Taux de Complexité</CardDescription><p className="text-2xl font-bold">{performanceData.complexityRate.toFixed(0)}<span className="text-base text-muted-foreground">%</span></p></Card>
                    </CardContent>
                </Card>
            </div>

            <Card>
                 <CardHeader> <CardTitle className="flex items-center gap-2"><Recycle />Opportunités de Mutualisation</CardTitle> <CardDescription>Détecte les préparations que vous pouvez produire en lot pour gagner du temps.</CardDescription> </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Préparation</TableHead><TableHead>Utilisée dans</TableHead><TableHead>Fréquence Suggérée</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {mutualisationData.length > 0 ? mutualisationData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell><TooltipProvider><Tooltip><TooltipTrigger asChild><Badge>{item.dishCount} plats</Badge></TooltipTrigger><TooltipContent><ul className="list-disc pl-5 text-left">{(item.dishes || []).map(dish => <li key={dish}>{dish}</li>)}</ul></TooltipContent></Tooltip></TooltipProvider></TableCell>
                                    <TableCell><Badge variant="outline">{item.frequency}</Badge></TableCell>
                                </TableRow>
                            )) : ( <TableRow><TableCell colSpan={3} className="h-24 text-center">Aucune mutualisation évidente trouvée.</TableCell></TableRow> )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader> <CardTitle className="flex items-center gap-2"><Flame />Vue de Production &amp; Rentabilité</CardTitle> <CardDescription>Analyse combinée du temps de production et de la rentabilité de chaque plat.</CardDescription> </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Plat</TableHead><TableHead>Temps Pondéré</TableHead><TableHead>Coût Portion</TableHead><TableHead>Marge Brute</TableHead><TableHead className="text-right">Rendement (DZD/min)</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {productionData.length > 0 ? productionData.map(dish => (
                                    <TableRow key={dish.id}>
                                        <TableCell className="font-medium">{dish.name}</TableCell>
                                        <TableCell><TooltipProvider><Tooltip><TooltipTrigger><span className="font-semibold underline decoration-dashed cursor-pointer">{dish.duration.toFixed(0)} min</span></TooltipTrigger><TooltipContent><p>Mise en place: {dish.duration_breakdown.mise_en_place.toFixed(0)} min</p><p>Cuisson: {dish.duration_breakdown.cuisson.toFixed(0)} min</p><p>Envoi: {dish.duration_breakdown.envoi.toFixed(0)} min</p></TooltipContent></Tooltip></TooltipProvider></TableCell>
                                        <TableCell className="font-semibold">{dish.foodCost.toFixed(2)} DZD</TableCell>
                                        <TableCell className="font-semibold text-green-600">{dish.grossMargin.toFixed(2)} DZD</TableCell>
                                        <TableCell className="text-right"><Badge variant={getYieldBadgeVariant(dish.yieldPerMin)}>{dish.yieldPerMin.toFixed(2)}</Badge></TableCell>
                                    </TableRow>
                                )) : ( <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun plat actif à analyser.</TableCell></TableRow> )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
