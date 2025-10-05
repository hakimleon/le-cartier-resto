
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ingredient } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// --- LOGIQUE DE CALCUL ISOLÉE ---

const recomputeIngredientCost = (
    quantity: number,
    useUnit: string,
    ingredient: Ingredient | null
): { cost: number; error?: string } => {
    
    // --- Sécurités fondamentales ---
    if (!ingredient) return { cost: 0, error: "Aucun ingrédient sélectionné." };
    if (!ingredient.purchasePrice || !ingredient.purchaseUnit || !ingredient.purchaseWeightGrams) return { cost: 0, error: "Données d'achat de l'ingrédient incomplètes." };
    if (quantity <= 0) return { cost: 0 };

    const u = (str: string) => str.toLowerCase().trim();
    const purchaseUnit = u(ingredient.purchaseUnit);
    const baseUnit = u(ingredient.baseUnit || 'g'); // 'g' par défaut si non défini
    const currentUseUnit = u(useUnit);

    // --- Étape 1 : Calculer le Coût par Unité de Base (Coût/g, Coût/ml...) ---
    let costPerBaseUnit: number;
    
    // On calcule le coût de revient pour l'ensemble de l'unité d'achat
    const totalPurchaseCost = ingredient.purchasePrice;
    
    // On calcule la quantité totale en unité de base pour cette unité d'achat
    let totalBaseUnitQuantityInPurchaseUnit: number;
    
    if (purchaseUnit === 'kg' && baseUnit === 'g') {
        totalBaseUnitQuantityInPurchaseUnit = 1000;
    } else if ((purchaseUnit === 'l' || purchaseUnit === 'litre') && baseUnit === 'ml') {
        totalBaseUnitQuantityInPurchaseUnit = 1000;
    } else if (purchaseUnit === baseUnit) {
        totalBaseUnitQuantityInPurchaseUnit = ingredient.purchaseWeightGrams; // Pour g -> g ou ml -> ml
    } else {
        // Cas complexe (pièce -> g, etc.)
        const equivalenceKey = `${purchaseUnit}->${baseUnit}`;
        const equivalenceValue = ingredient.equivalences?.[equivalenceKey];
        if (equivalenceValue) {
            totalBaseUnitQuantityInPurchaseUnit = equivalenceValue;
        } else {
            // Fallback si pas d'équivalence : on utilise le poids de l'unité d'achat
            totalBaseUnitQuantityInPurchaseUnit = ingredient.purchaseWeightGrams;
        }
    }
    
    if (totalBaseUnitQuantityInPurchaseUnit === 0) return { cost: 0, error: "La quantité de base dans l'unité d'achat est zéro." };

    const costPerPurchaseUnitQuantity = totalPurchaseCost / totalBaseUnitQuantityInPurchaseUnit;
    
    // Appliquer le rendement
    costPerBaseUnit = costPerPurchaseUnitQuantity / ((ingredient.yieldPercentage || 100) / 100);

    // --- Étape 2: Convertir la quantité utilisée en Unité de Base ---
    let quantityInBaseUnit: number;
    
    if (currentUseUnit === baseUnit) {
        quantityInBaseUnit = quantity;
    } else {
        const equivalenceKey = `${currentUseUnit}->${baseUnit}`;
        const equivalenceValue = ingredient.equivalences?.[equivalenceKey];
        if (equivalenceValue) {
            quantityInBaseUnit = quantity * equivalenceValue;
        } else {
             return { cost: 0, error: `Aucune équivalence trouvée pour convertir '${currentUseUnit}' en '${baseUnit}'.` };
        }
    }
    
    // --- Étape 3: Calcul Final ---
    const finalCost = quantityInBaseUnit * costPerBaseUnit;

    return { cost: finalCost };
};


// --- COMPOSANT CLIENT ---

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
        return recomputeIngredientCost(quantity, unit, selectedIngredient);
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
                                <Select onValueChange={setUnit} defaultValue={unit}>
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
                                {cost.toFixed(2)} <span className="text-2xl text-muted-foreground">DZD</span>
                            </div>
                            {costError && (
                                <p className="mt-2 text-sm text-destructive">{costError}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* --- FICHE TECHNIQUE INGRÉDIENT --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>Données de l'Ingrédient</CardTitle>
                        <CardDescription>Vérifiez ici les valeurs utilisées pour le calcul.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedIngredient ? (
                            <Table>
                                <TableBody>
                                    <TableRow><TableCell className="font-medium">Nom</TableCell><TableCell>{selectedIngredient.name}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Prix d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchasePrice} DZD</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Unité d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseUnit}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium">Poids Unité (g)</TableCell><TableCell>{selectedIngredient.purchaseWeightGrams} g</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-green-600">Unité de Base</TableCell><TableCell className="text-green-600">{selectedIngredient.baseUnit || 'Non défini'}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-green-600">Équivalences</TableCell><TableCell className="text-green-600 font-mono text-xs">{selectedIngredient.equivalences ? JSON.stringify(selectedIngredient.equivalences) : 'Aucune'}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium">Rendement</TableCell><TableCell>{selectedIngredient.yieldPercentage} %</TableCell></TableRow>
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
