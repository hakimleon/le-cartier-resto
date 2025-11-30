
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ingredient } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Pencil } from "lucide-react";
import { computeIngredientCost } from "@/utils/unitConverter";
import { IngredientModal } from "../ingredients/IngredientModal";
import { Button } from "@/components/ui/button";


export default function TestIngredientsClient() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<string>('pièce');


    const fetchIngredients = useCallback(async (selectFirst = false) => {
        setIsLoading(true);
        const ingredientsQuery = query(collection(db, "ingredients"));
        const querySnapshot = await getDocs(ingredientsQuery);
        const ingredientsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
        
        ingredientsData.sort((a,b) => a.name.localeCompare(b.name));
        setIngredients(ingredientsData);

        if (selectFirst && ingredientsData.length > 0) {
            setSelectedIngredientId(ingredientsData[0].id!);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchIngredients(true);
    }, [fetchIngredients]);

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
                <p className="text-muted-foreground">Page isolée pour tester la logique de calcul du coût des ingrédients.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                                        <SelectItem value="botte">botte</SelectItem>
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
                         <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Données de l'Ingrédient</CardTitle>
                                <CardDescription>Vérifiez les valeurs de base utilisées pour le calcul.</CardDescription>
                            </div>
                            {selectedIngredient && (
                                <IngredientModal
                                    ingredient={selectedIngredient}
                                    onSuccess={() => fetchIngredients(false)}
                                >
                                    <Button variant="outline" size="sm">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Button>
                                </IngredientModal>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedIngredient ? (
                            <div className="space-y-4">
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell className="font-medium">Nom</TableCell><TableCell>{selectedIngredient.name}</TableCell></TableRow>
                                        <TableRow><TableCell className="font-medium text-blue-600">Prix d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchasePrice} DZD</TableCell></TableRow>
                                        <TableRow><TableCell className="font-medium text-blue-600">Unité d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseUnit}</TableCell></TableRow>
                                        <TableRow><TableCell className="font-medium text-blue-600">Poids/Vol de l'Unité Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseWeightGrams} {selectedIngredient.baseUnit || 'g'}</TableCell></TableRow>
                                        <TableRow><TableCell className="font-medium">Rendement (%)</TableCell><TableCell>{selectedIngredient.yieldPercentage} %</TableCell></TableRow>
                                        <TableRow><TableCell className="font-medium">Unité de Base</TableCell><TableCell>{selectedIngredient.baseUnit || 'g (défaut)'}</TableCell></TableRow>
                                    </TableBody>
                                </Table>

                                {selectedIngredient.equivalences && Object.keys(selectedIngredient.equivalences).length > 0 && (
                                    <div>
                                        <h4 className="font-medium mt-4 mb-2">Table d'équivalence</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Conversion</TableHead>
                                                    <TableHead className="text-right">Valeur</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Object.entries(selectedIngredient.equivalences).map(([key, value]) => (
                                                    <TableRow key={key}>
                                                        <TableCell>{key}</TableCell>
                                                        <TableCell className="text-right">{String(value)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Sélectionnez un ingrédient pour voir ses données.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
