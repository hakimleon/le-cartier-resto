
"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, Clock, Flame, Recycle, Euro, TrendingUp, Info, Sparkles, BrainCircuit, Loader2 } from 'lucide-react';
import type { SummaryData, ProductionData, MutualisationData } from './page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { getAIRecommendations } from './actions';
import MarkdownRenderer from '@/components/MarkdownRenderer';


interface MenuAnalysisClientProps {
    summary: SummaryData;
    productionData: ProductionData[];
    mutualisationData: MutualisationData[];
    initialError: string | null;
}

export default function MenuAnalysisClient({ summary, productionData, mutualisationData, initialError }: MenuAnalysisClientProps) {
    const [isAnalyzing, startTransition] = useTransition();
    const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);

    const getYieldBadgeVariant = (yieldPerMin: number): "default" | "secondary" | "destructive" => {
        if (yieldPerMin > 100) return "default";
        if (yieldPerMin > 50) return "secondary";
        return "destructive";
    }

    const handleAIAnalysis = () => {
        setAiRecommendations(null);
        startTransition(async () => {
            const result = await getAIRecommendations({
                summary,
                production: productionData,
                mutualisations: mutualisationData,
            });
            setAiRecommendations(result);
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

            {isAnalyzing && !aiRecommendations && (
                <Card className="flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <BrainCircuit className="h-10 w-10 text-primary mb-4"/>
                    <p className="font-semibold">L'IA analyse votre menu...</p>
                    <p className="text-sm text-muted-foreground">Calcul des optimisations, rentabilité et points de friction.</p>
                </Card>
            )}

            {aiRecommendations && (
                 <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary"><Sparkles /> Recommandations Stratégiques de l'IA</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none text-foreground">
                        <MarkdownRenderer text={aiRecommendations} />
                    </CardContent>
                </Card>
            )}


            {/* --- Volet 1: SUMMARY --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 />Résumé du Menu</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                        <CardDescription className="flex items-center gap-2 text-sm"><Info /> Plats Actifs</CardDescription>
                        <p className="text-2xl font-bold">{summary.totalDishes}</p>
                    </Card>
                     <Card className="p-4">
                        <CardDescription className="flex items-center gap-2 text-sm"><Clock /> Durée Moyenne</CardDescription>
                        <p className="text-2xl font-bold">{summary.averageDuration.toFixed(0)} <span className="text-base text-muted-foreground">min</span></p>
                    </Card>
                    <Card className="p-4 col-span-2">
                        <CardDescription className="flex items-center gap-2 text-sm">Répartition</CardDescription>
                         <div className="flex flex-wrap gap-2 pt-2">
                            {Object.entries(summary.categoryCount).map(([category, count]) => (
                                <Badge key={category} variant="secondary" className="text-sm">{category}: {count}</Badge>
                            ))}
                        </div>
                    </Card>
                </CardContent>
            </Card>

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
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="item-1" className="border-b-0">
                                                <AccordionTrigger className="py-1 hover:no-underline">
                                                    <Badge>{item.dishCount} plats</Badge>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2">
                                                    <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                                        {item.dishes.map(dish => <li key={dish}>{dish}</li>)}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
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
                    <CardTitle className="flex items-center gap-2"><Flame />Vue de Production & Rentabilité</CardTitle>
                    <CardDescription>Analyse combinée du temps de production et de la rentabilité de chaque plat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Plat</TableHead>
                                <TableHead>Temps Total</TableHead>
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
