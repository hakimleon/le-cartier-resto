
"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, Clock, Flame, Recycle, Euro, TrendingUp, Info, Sparkles, BrainCircuit, Loader2, CalendarClock, Target, ListChecks, Percent, Puzzle, DollarSign, Users, Package, Lightbulb } from 'lucide-react';
import type { SummaryData, ProductionData, MutualisationData, PlanningTask } from './page';
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


interface MenuAnalysisClientProps {
    summary: SummaryData;
    productionData: ProductionData[];
    mutualisationData: MutualisationData[];
    performanceData: PerformanceData;
    initialError: string | null;
}

// Types for the new AI output structure
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

export default function MenuAnalysisClient({ summary, productionData, mutualisationData, performanceData, initialError }: MenuAnalysisClientProps) {
    const [isAnalyzing, startTransition] = useTransition();
    const [aiResults, setAiResults] = useState<AIResults | null>(null);
    const { toast } = useToast();

    const getYieldBadgeVariant = (yieldPerMin: number): "default" | "secondary" | "destructive" => {
        if (yieldPerMin > 100) return "default";
        if (yieldPerMin > 50) return "secondary";
        return "destructive";
    }
    
    const getPriorityBadge = (priority: number) => {
        if (priority === 1) return <Badge variant="destructive">Haute</Badge>
        if (priority === 2) return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Moyenne</Badge>
        return <Badge variant="outline">Basse</Badge>
    }
    
    const getReengineeringPriorityBadge = (priority: 'Urgent' | 'Moyen' | 'Bon') => {
        switch (priority) {
            case 'Urgent': return <Badge variant="destructive">🔴 Urgent</Badge>;
            case 'Moyen': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">🟠 Moyen</Badge>;
            case 'Bon': return <Badge variant="secondary" className="bg-green-100 text-green-800">🟢 Bon</Badge>;
            default: return <Badge variant="outline">{priority}</Badge>;
        }
    }


    const handleAIAnalysis = () => {
        setAiResults(null);
        startTransition(async () => {
            const result = await getAIRecommendations({
                summary,
                production: productionData,
                mutualisations: mutualisationData,
            });
            if ('error' in result) {
                 setAiResults(null);
                 toast({
                    title: "Erreur d'analyse IA",
                    description: result.error,
                    variant: "destructive",
                 });
                 console.error(result.error);
            } else {
                 setAiResults(result);
            }
        });
    }
    
    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu</h1>
                    <p className="text-muted-foreground">Synthèse, production et rentabilité de vos plats actifs.</p>
                </div>
                 <Button onClick={handleAIAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isAnalyzing ? 'Analyse en cours...' : "Analyser avec l'IA"}
                </Button>
            </header>

            {initialError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de Chargement</AlertTitle>
                    <AlertDescription>{initialError}</AlertDescription>
                </Alert>
            )}

            {isAnalyzing && !aiResults && (
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
                                <TableRow><TableCell colSpan={4}>Aucune suggestion spécifique pour les plats.</TableCell></TableRow>
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
                                       <TableHead>Priorité</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {aiResults.production_planning_suggestions && aiResults.production_planning_suggestions.length > 0 ? aiResults.production_planning_suggestions.map((task, index) => (
                                       <TableRow key={index}>
                                           <TableCell className="font-medium">{task.heure}</TableCell>
                                           <TableCell><Badge variant="outline">{task.poste}</Badge></TableCell>
                                           <TableCell>{task.tache}</TableCell>
                                           <TableCell>{getPriorityBadge(task.priorite)}</TableCell>
                                       </TableRow>
                                   )) : (
                                      <TableRow>
                                           <TableCell colSpan={4} className="h-24 text-center">
                                               Le planning n'a pas pu être généré.
                                           </TableCell>
                                       </TableRow>
                                   )}
                               </TableBody>
                           </Table>
                        </CardContent>
                    </Card>
                </div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Volet 1: SUMMARY --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 />Résumé du Menu</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Card className="p-4">
                            <CardDescription className="flex items-center gap-2 text-sm"><Info /> Plats Actifs</CardDescription>
                            <p className="text-2xl font-bold">{summary.totalDishes}</p>
                        </Card>
                         <Card className="p-4">
                            <CardDescription className="flex items-center gap-2 text-sm"><Clock /> Durée Pondérée Moyenne</CardDescription>
                            <p className="text-2xl font-bold">{summary.averageDuration.toFixed(0)} <span className="text-base text-muted-foreground">min</span></p>
                        </Card>
                    </CardContent>
                </Card>
                
                {/* --- Volet 7: PERFORMANCE --- */}
                {performanceData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target />Performance &amp; KPIs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Card className="p-4">
                                <CardDescription className="flex items-center gap-2 text-sm"><Recycle /> Préparations Communes</CardDescription>
                                <p className="text-2xl font-bold">{performanceData.commonPreparationsCount}</p>
                            </Card>
                            <Card className="p-4">
                                <CardDescription className="flex items-center gap-2 text-sm"><Euro /> Marge Brute Moyenne</CardDescription>
                                <p className="text-2xl font-bold">{performanceData.averageMargin.toFixed(2)} <span className="text-base text-muted-foreground">DZD</span></p>
                            </Card>
                            <Card className="p-4">
                                <CardDescription className="flex items-center gap-2 text-sm"><ListChecks /> Tps Moyen MEP</CardDescription>
                                <p className="text-2xl font-bold">{performanceData.averageMepTime.toFixed(0)} <span className="text-base text-muted-foreground">min</span></p>
                            </Card>
                            <Card className="p-4">
                                <CardDescription className="flex items-center gap-2 text-sm"><Puzzle /> Taux de Complexité</CardDescription>
                                <p className="text-2xl font-bold">{performanceData.complexityRate.toFixed(0)}<span className="text-base text-muted-foreground">%</span></p>
                            </Card>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* --- Volet 3: MUTUALISATIONS --- */}
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Recycle />Opportunités de Mutualisation</CardTitle>
                    <CardDescription>Détecte les préparations que vous pouvez produire en lot pour gagner du temps.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Préparation</TableHead>
                                <TableHead>Utilisée dans</TableHead>
                                <TableHead>Fréquence Suggérée</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mutualisationData.length > 0 ? mutualisationData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge>{item.dishCount} plats</Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <ul className="list-disc pl-5 text-left">
                                                        {(item.dishes || []).map(dish => <li key={dish}>{dish}</li>)}
                                                    </ul>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{item.frequency}</Badge></TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">Aucune mutualisation évidente trouvée (minimum 2 plats).</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


             {/* --- Volet 2 & 5: PRODUCTION & RENTABILITÉ --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Flame />Vue de Production &amp; Rentabilité</CardTitle>
                    <CardDescription>Analyse combinée du temps de production et de la rentabilité de chaque plat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Plat</TableHead>
                                <TableHead>Temps Pondéré</TableHead>
                                <TableHead>Coût Portion</TableHead>
                                <TableHead>Marge Brute</TableHead>
                                <TableHead className="text-right">Rendement (DZD/min)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productionData.length > 0 ? productionData.map(dish => (
                                    <TableRow key={dish.id}>
                                        <TableCell className="font-medium">{dish.name}</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                         <span className="font-semibold underline decoration-dashed cursor-pointer">{dish.duration.toFixed(0)} min</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Mise en place: {dish.duration_breakdown.mise_en_place.toFixed(0)} min</p>
                                                        <p>Cuisson: {dish.duration_breakdown.cuisson.toFixed(0)} min</p>
                                                        <p>Envoi: {dish.duration_breakdown.envoi.toFixed(0)} min</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {dish.foodCost.toFixed(2)} DZD
                                        </TableCell>
                                         <TableCell className="font-semibold text-green-600">
                                            {dish.grossMargin.toFixed(2)} DZD
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={getYieldBadgeVariant(dish.yieldPerMin)}>
                                                {dish.yieldPerMin.toFixed(2)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Aucun plat actif à analyser.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
