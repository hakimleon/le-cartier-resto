
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
import { AlertTriangle, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";


export default function TestIngredientsClient() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<string>('pièce');

    // State pour les équivalences éditables localement
    const [editableEquivalences, setEditableEquivalences] = useState<Record<string, number>>({});
    const [newEq, setNewEq] = useState({ from: 'pièce', to: 'g', value: '' });

    useEffect(() => {
        const fetchIngredients = async () => {
            setIsLoading(true);
            const ingredientsQuery = query(collection(db, "ingredients"));
            const querySnapshot = await getDocs(ingredientsQuery);
            const ingredientsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
            setIngredients(ingredientsData);
            if (ingredientsData.length > 0) {
                setSelectedIngredientId(ingredientsData[0].id!);
                setEditableEquivalences(ingredientsData[0].equivalences || {});
            }
            setIsLoading(false);
        };
        fetchIngredients();
    }, []);

    const selectedIngredient = useMemo(() => {
        const ing = ingredients.find(ing => ing.id === selectedIngredientId) || null;
        if (ing) {
             setEditableEquivalences(ing.equivalences || {});
        }
        return ing;
    }, [selectedIngredientId, ingredients]);

    const simulatedIngredient = useMemo(() => {
        if (!selectedIngredient) return null;
        return {
            ...selectedIngredient,
            equivalences: editableEquivalences,
        };
    }, [selectedIngredient, editableEquivalences]);

    const { cost, error: costError } = useMemo(() => {
        if (!simulatedIngredient) return { cost: 0, error: "Aucun ingrédient sélectionné." };
        return computeIngredientCost(simulatedIngredient, quantity, unit);
    }, [quantity, unit, simulatedIngredient]);


    const handleAddEquivalence = () => {
        const value = parseFloat(newEq.value);
        if (newEq.from && newEq.to && !isNaN(value) && value > 0) {
            const key = `${newEq.from}->${newEq.to}`;
            setEditableEquivalences(prev => ({ ...prev, [key]: value }));
            setNewEq({ from: 'pièce', to: 'g', value: '' }); // Reset
        }
    };

    const handleRemoveEquivalence = (key: string) => {
        setEditableEquivalences(prev => {
            const newEquivalences = { ...prev };
            delete newEquivalences[key];
            return newEquivalences;
        });
    };

    const getWeightLabel = (ingredient: Ingredient | null) => {
        if (!ingredient) return "Poids/Vol Achat";
        const unit = ingredient.purchaseUnit?.toLowerCase();
        if (unit === 'pièce' || unit === 'unité') return "Poids moyen par pièce (g)";
        if (unit === 'botte') return "Poids moyen par botte (g)";
        if (unit === 'l' || unit === 'litre' || unit === 'litres' || unit === 'cl' || unit === 'ml') return "Volume équivalent (ml)";
        return "Poids équivalent (g)";
    };

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
                        <CardTitle>Données de l'Ingrédient Simulé</CardTitle>
                        <CardDescription>Vérifiez les valeurs utilisées pour le calcul. Les équivalences sont modifiables localement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedIngredient ? (
                            <>
                            <Table>
                                <TableBody>
                                    <TableRow><TableCell className="font-medium">Nom</TableCell><TableCell>{selectedIngredient.name}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Prix d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchasePrice} DZD</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">Unité d'Achat</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseUnit}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-blue-600">{getWeightLabel(selectedIngredient)}</TableCell><TableCell className="text-blue-600">{selectedIngredient.purchaseWeightGrams}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium">Rendement (%)</TableCell><TableCell>{selectedIngredient.yieldPercentage} %</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium text-green-600">Unité de Base</TableCell><TableCell className="text-green-600">{selectedIngredient.baseUnit || 'Non défini'}</TableCell></TableRow>
                                </TableBody>
                            </Table>

                            <Separator className="my-4"/>
                            
                            <div>
                                <h4 className="font-medium text-green-600 mb-2">Table d'Équivalences (modifiable)</h4>
                                {Object.keys(editableEquivalences).length > 0 ? (
                                    <div className="space-y-2">
                                        {Object.entries(editableEquivalences).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                <span className="font-mono">{`1 ${key.split('->')[0]} = ${value} ${key.split('->')[1]}`}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveEquivalence(key)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-muted-foreground">Aucune équivalence définie.</p>}

                                <div className="flex items-end gap-2 mt-4">
                                     <div className="grid w-full grid-cols-3 gap-2">
                                        <Input value={newEq.from} onChange={e => setNewEq({...newEq, from: e.target.value})} placeholder="De (ex: pièce)" />
                                        <Input value={newEq.to} onChange={e => setNewEq({...newEq, to: e.target.value})} placeholder="Vers (ex: g)" />
                                        <Input type="number" value={newEq.value} onChange={e => setNewEq({...newEq, value: e.target.value})} placeholder="Valeur (ex: 50)"/>
                                    </div>
                                    <Button size="icon" onClick={handleAddEquivalence} className="shrink-0"><PlusCircle className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Sélectionnez un ingrédient pour voir ses données.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
