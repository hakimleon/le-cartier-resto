
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, Clock, Flame, Send, Tag, Euro, ChefHat } from 'lucide-react';
import type { SummaryData, ProductionData } from './page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MenuAnalysisClientProps {
    summary: SummaryData;
    productionData: ProductionData[];
    initialError: string | null;
}

export default function MenuAnalysisClient({ summary, productionData, initialError }: MenuAnalysisClientProps) {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu (Étape 1)</h1>
                <p className="text-muted-foreground">Résumé et vue de production de vos plats actifs.</p>
            </header>

            {initialError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de Chargement</AlertTitle>
                    <AlertDescription>{initialError}</AlertDescription>
                </Alert>
            )}

            {/* --- Volet 1: SUMMARY --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 />Résumé du Menu</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                        <CardDescription className="flex items-center gap-2 text-sm"><ChefHat /> Plats Actifs</CardDescription>
                        <p className="text-2xl font-bold">{summary.totalDishes}</p>
                    </Card>
                     <Card className="p-4">
                        <CardDescription className="flex items-center gap-2 text-sm"><Clock /> Durée Moyenne</CardDescription>
                        <p className="text-2xl font-bold">{summary.averageDuration.toFixed(0)} <span className="text-base text-muted-foreground">min</span></p>
                    </Card>
                    <Card className="p-4 col-span-2">
                        <CardDescription className="flex items-center gap-2 text-sm"><Tag /> Répartition</CardDescription>
                         <div className="flex flex-wrap gap-2 pt-2">
                            {Object.entries(summary.categoryCount).map(([category, count]) => (
                                <Badge key={category} variant="secondary" className="text-sm">{category}: {count}</Badge>
                            ))}
                        </div>
                    </Card>
                </CardContent>
            </Card>

             {/* --- Volet 2: PRODUCTION --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Flame />Vue de Production par Plat</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Plat</TableHead>
                                <TableHead>Temps de Production</TableHead>
                                <TableHead>Ingrédients Clés</TableHead>
                                <TableHead className="text-right">Coût Matière / Portion</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productionData.length > 0 ? productionData.map(dish => {
                                const total = dish.duration || 1;
                                const mepPercentage = (dish.duration_breakdown.mise_en_place / total) * 100;
                                const cuissonPercentage = (dish.duration_breakdown.cuisson / total) * 100;
                                const envoiPercentage = (dish.duration_breakdown.envoi / total) * 100;
                                
                                return (
                                    <TableRow key={dish.id}>
                                        <TableCell className="font-medium">{dish.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold w-12">{dish.duration.toFixed(0)}'</span>
                                                <div className="w-full">
                                                    <div className="flex text-xs text-muted-foreground">
                                                        <div style={{ width: `${mepPercentage}%`}} className="text-center">MEP</div>
                                                        <div style={{ width: `${cuissonPercentage}%`}} className="text-center">Cuisson</div>
                                                        <div style={{ width: `${envoiPercentage}%`}} className="text-center">Envoi</div>
                                                    </div>
                                                    <div className="flex w-full h-2 rounded-full overflow-hidden">
                                                        <div style={{ width: `${mepPercentage}%` }} className="bg-blue-400" title={`Mise en place: ${dish.duration_breakdown.mise_en_place.toFixed(0)} min`}></div>
                                                        <div style={{ width: `${cuissonPercentage}%` }} className="bg-red-400" title={`Cuisson: ${dish.duration_breakdown.cuisson.toFixed(0)} min`}></div>
                                                        <div style={{ width: `${envoiPercentage}%` }} className="bg-green-400" title={`Envoi: ${dish.duration_breakdown.envoi.toFixed(0)} min`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {dish.keyIngredients.map(ing => <Badge key={ing} variant="outline">{ing}</Badge>)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {dish.foodCost.toFixed(2)} DZD
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
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
