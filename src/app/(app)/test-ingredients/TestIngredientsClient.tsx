
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ingredient } from "@/lib/types";
import { computeIngredientCost } from "@/lib/unitConverter";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


export default function TestIngredientsClient() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<string>('pièce');

    useEffect(() => {
        const fetchIngredients = async () => {
            setIsLoading(true);
            const ingredientsQuery = query(collection(db, "ingredients"));
            const querySnapshot = await getDocs(ingredientsQuery);
            const ingredientsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
            setIngredients(ingredientsData);
            if (ingredientsData.length > 0) {
                setSelectedIngredientId(ingredientsData[0].id!);
            }
            setIsLoading(false);
        };
        fetchIngredients();
    }, []);

    const selectedIngredient = useMemo(() => {
        return ingredients.find(ing => ing.id === selectedIngredientId) || null;
    }, [selectedIngredientId, ingredients]);

    const { cost, error: costError } = useMemo(() => {
        if (!selectedIngredient) return { cost: 0, error: "Aucun ingrédient sélectionné." };
        return computeIngredientCost(selectedIngredient, quantity, unit);
    }, [quantity, unit, selectedIngredient]);

    if (isLoading) {
        return <Skeleton className="h-[400px] w-full" />;
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">Laboratoire de Calcul de Coût</h1>
                <p className="text-muted-foreground">Page isolée pour tester la nouvelle logique de calcul du coût des ingrédients.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- PANNEAU DE CONTROLE --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>Panneau de Test</CardTitle>
                        <CardDescription>Simulez l'utilisation d'un ingrédient dans une recette.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>1. Choisir un ingrédient</Label>
                            <Select onValueChange={setSelectedIngredientId} value={selectedIngredientId || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un ingrédient..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ingredients.map(ing => (
                                        <SelectItem key={ing.id} value={ing.id!}>
                                            {ing.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">2. Quantité utilisée</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                    placeholder="Ex: 2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>3. Unité utilisée</Label>
                                <Select onValueChange={setUnit} value={unit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pièce">pièce</SelectItem>
                                        <SelectItem value="g">g</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="l">l</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold">Résultat du Calcul</h3>
                            <div className="mt-2 text-4xl font-bold text-primary">
                                {cost.toFixed(4)} <span className="text-2xl text-muted-foreground">DZD</span>
                            </div>
                            {costError && (
                                <Alert variant="destructive" className="mt-4">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Erreur de calcul</AlertTitle>
                                  <AlertDescription>
                                    {costError}
                                  </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* --- FICHE TECHNIQUE INGRÉDIENT --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>Données de l'Ingrédient Sélectionné</CardTitle>
                        <CardDescription>Vérifiez ici les valeurs utilisées pour le calcul.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedIngredient ? (
                            <Table>
                                <TableBody>
                                    <TableRow><TableCell className="font-medium">Nom</TableCell><TableCell>{selectedIngredient.name}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Prix d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchasePrice} DZD</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Unité d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseUnit}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Poids/Vol Achat (g/ml)</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseWeightGrams}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium">Rendement (%)</TableCell><TableCell>{selectedIngredient.yieldPercentage} %</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-green-600">Unité de Base</TableCell><TableCell className="text-green-600">{selectedIngredient.baseUnit || 'Non défini'}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-green-600">Table d'Équivalences</TableCell><TableCell className="text-green-600 font-mono text-xs">{selectedIngredient.equivalences ? JSON.stringify(selectedIngredient.equivalences, null, 2) : 'Aucune'}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Sélectionnez un ingrédient pour voir ses données.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
