
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ingredient } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Simplified conversion for demonstration
const getConversionFactor = (fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit || fromUnit.toLowerCase().trim() === toUnit.toLowerCase().trim()) return 1;

    const u = (unit: string) => unit.toLowerCase().trim();
    const factors: Record<string, number> = {
        'kg': 1000, 'g': 1, 'mg': 0.001,
        'l': 1000, 'ml': 1, 'cl': 10,
        'litre': 1000, 'litres': 1000,
        'pièce': 1, 'unité': 1, 'botte': 1,
    };
    
    const fromFactor = factors[u(fromUnit)];
    const toFactor = factors[u(toUnit)];

    if (fromFactor !== undefined && toFactor !== undefined) {
        const weightUnits = ["g", "kg", "mg"];
        const volumeUnits = ["ml", "l", "cl"];

        const bothWeight = weightUnits.includes(u(fromUnit)) && weightUnits.includes(u(toUnit));
        const bothVolume = volumeUnits.includes(u(fromUnit)) && volumeUnits.includes(u(toUnit));

        if (bothWeight || bothVolume) {
          return fromFactor / toFactor;
        }
    }
    
    // Fallback for piece -> g or similar requires specific data not available in this simplified version
    if (u(toUnit) === 'g' && (u(fromUnit) === 'pièce' || u(fromUnit) === 'unité')) {
        console.warn(`[CONVERSION] No specific weight for 'pièce' of this ingredient. Assuming 1 pièce = 1g which is likely incorrect.`);
        return 1;
    }


    console.warn(`[CONVERSION] Conversion impossible entre '${fromUnit}' et '${toUnit}'. Facteur par défaut : 1.`);
    return 1;
};


const computeIngredientCost = (
  ingredient: Ingredient,
  usedQuantity: number,
  usedUnit: string
): { cost: number; error?: string } => {
  if (ingredient.purchasePrice == null || ingredient.purchaseWeightGrams == null || ingredient.purchaseWeightGrams === 0) {
    return { cost: 0, error: "Données d'achat (prix, poids) manquantes ou invalides." };
  }

  const costPerGramRaw = ingredient.purchasePrice / ingredient.purchaseWeightGrams;
  const costPerGramNet = costPerGramRaw / ((ingredient.yieldPercentage || 100) / 100);

  const conversionFactorToGrams = getConversionFactor(usedUnit, 'g');
  if (conversionFactorToGrams === 1 && usedUnit.toLowerCase() !== 'g') {
       return { cost: 0, error: `Conversion de '${usedUnit}' vers 'g' non standard. Nécessite une table d'équivalence (fonctionnalité retirée).` };
  }

  const quantityInGrams = usedQuantity * conversionFactorToGrams;
  const finalCost = quantityInGrams * costPerGramNet;
  
  if (isNaN(finalCost)) {
    return { cost: 0, error: "Le résultat du calcul est invalide (NaN)." };
  }

  return { cost: finalCost };
};


export default function TestIngredientsClient() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<string>('g');


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
                        <CardTitle>Données de l'Ingrédient</CardTitle>
                        <CardDescription>Vérifiez les valeurs de base utilisées pour le calcul.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedIngredient ? (
                            <Table>
                                <TableBody>
                                    <TableRow><TableCell className="font-medium">Nom</TableCell><TableCell>{selectedIngredient.name}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Prix d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchasePrice} DZD</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Unité d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseUnit}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Poids/Vol de l'Unité Achat (g/ml)</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseWeightGrams}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium">Rendement (%)</TableCell><TableCell>{selectedIngredient.yieldPercentage} %</TableCell></TableRow>
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
