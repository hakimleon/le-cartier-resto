"use client";

import { useState, useTransition } from 'react';
import { Recipe } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Calculator, ChefHat, Loader2, NotebookText, Carrot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateProductionPlan, type ProductionPlan } from './actions';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface ProductionPlanClientProps {
    activeDishes: Recipe[];
    initialError: string | null;
}

export default function ProductionPlanClient({ activeDishes, initialError }: ProductionPlanClientProps) {
    const [forecast, setForecast] = useState<Record<string, string>>({});
    const [results, setResults] = useState<ProductionPlan | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleInputChange = (dishId: string, value: string) => {
        setForecast(prev => ({ ...prev, [dishId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numericForecast: Record<string, number> = Object.entries(forecast)
            .map(([id, quantity]) => [id, parseInt(quantity, 10)])
            .filter(([, quantity]) => !isNaN(quantity) && quantity > 0)
            .reduce((acc, [id, quantity]) => ({ ...acc, [id as string]: quantity as number }), {});
            
        if (Object.keys(numericForecast).length === 0) {
            toast({
                title: "Aucune prévision saisie",
                description: "Veuillez entrer une quantité pour au moins un plat.",
                variant: "destructive"
            });
            return;
        }

        setResults(null);
        startTransition(async () => {
            const calculatedResults = await calculateProductionPlan(numericForecast);
            if(calculatedResults.error) {
                 toast({
                    title: "Erreur de Calcul",
                    description: calculatedResults.error,
                    variant: "destructive"
                });
                setResults(null);
            } else {
                setResults(calculatedResults);
            }
        });
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Plan de Production Interactif</h1>
                <p className="text-muted-foreground">Saisissez vos prévisions de ventes pour générer le plan de mise en place.</p>
            </header>

            {initialError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de chargement</AlertTitle>
                    <AlertDescription>{initialError}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ChefHat /> Prévisions de Ventes</CardTitle>
                        <CardDescription>Entrez le nombre de couverts estimés pour chaque plat actif.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                            {activeDishes.map(dish => (
                                <div key={dish.id} className="space-y-2">
                                    <Label htmlFor={dish.id} className="text-sm">{dish.name}</Label>
                                    <Input 
                                        id={dish.id}
                                        type="number"
                                        placeholder="Qté"
                                        value={forecast[dish.id!] || ''}
                                        onChange={(e) => handleInputChange(dish.id!, e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Button type="submit" disabled={isPending} size="lg" className="w-full sm:w-auto">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                    {isPending ? 'Calcul en cours...' : 'Générer le Plan de Production'}
                </Button>
            </form>

            {isPending && (
                <div className="text-center py-12">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Analyse des recettes en cours...</p>
                </div>
            )}

            {results && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><NotebookText className="h-5 w-5"/>Préparations Requises</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead className="text-right">Quantité</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {results.requiredPreparations.length > 0 ? (
                                        results.requiredPreparations.map(prep => (
                                            <TableRow key={prep.name}>
                                                <TableCell>{prep.name}</TableCell>
                                                <TableCell className="text-right font-medium">{prep.quantity.toFixed(2)} {prep.unit}</TableCell>
                                            </TableRow>
                                        ))
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Aucune préparation de base requise.</TableCell>
                                        </TableRow>
                                     )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Carrot className="h-5 w-5"/>Ingrédients Bruts Requis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Quantité</TableHead>
                                        <TableHead className="text-right">Coût</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.requiredIngredients.length > 0 ? (
                                        results.requiredIngredients.map(ing => (
                                            <TableRow key={ing.name}>
                                                <TableCell>{ing.name}</TableCell>
                                                <TableCell>{ing.quantity.toFixed(2)} {ing.unit}</TableCell>
                                                <TableCell className="text-right font-medium">{ing.totalCost.toFixed(2)} DZD</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Aucun ingrédient brut requis.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                {results.requiredIngredients.length > 0 && (
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-bold">Coût Total des Ingrédients</TableCell>
                                            <TableCell className="text-right font-extrabold text-lg">{results.totalIngredientsCost.toFixed(2)} DZD</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
