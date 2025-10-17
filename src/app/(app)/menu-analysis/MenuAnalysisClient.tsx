"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Recipe, Ingredient, Preparation, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { getConversionFactor, computeIngredientCost } from '@/utils/unitConverter';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ChefHat } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type EnrichedRecipe = Recipe & { foodCost?: number };

export default function MenuAnalysisClient() {
    const [dishes, setDishes] = useState<EnrichedRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const calculateAllCosts = async () => {
            if (!isFirebaseConfigured) {
                setError("La configuration de Firebase est manquante.");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                // Étape 1 : Récupérer toutes les données en parallèle
                const [
                    recipesSnap,
                    ingredientsSnap,
                    preparationsSnap,
                    garnishesSnap,
                    recipeIngsSnap,
                    recipePrepsSnap
                ] = await Promise.all([
                    getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
                    getDocs(collection(db, "ingredients")),
                    getDocs(collection(db, "preparations")),
                    getDocs(collection(db, "garnishes")),
                    getDocs(collection(db, "recipeIngredients")),
                    getDocs(collection(db, "recipePreparationLinks")),
                ]);

                const activeRecipes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
                const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Ingredient]));
                const allPrepsAndGarnishesList = [
                    ...preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation)),
                    ...garnishesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation))
                ];
                const allPrepsAndGarnishes = new Map(allPrepsAndGarnishesList.map(p => [p.id, p]));
                
                const recipeIngredientLinks = recipeIngsSnap.docs.map(d => d.data() as RecipeIngredientLink);
                const recipePreparationLinks = recipePrepsSnap.docs.map(d => d.data() as RecipePreparationLink);
                
                // Regrouper les liens par parent pour un accès rapide
                const linksByParentId = new Map<string, { ingredients: RecipeIngredientLink[], preparations: RecipePreparationLink[] }>();
                
                recipeIngredientLinks.forEach(link => {
                    if (!linksByParentId.has(link.recipeId)) linksByParentId.set(link.recipeId, { ingredients: [], preparations: [] });
                    linksByParentId.get(link.recipeId)!.ingredients.push(link);
                });
                recipePreparationLinks.forEach(link => {
                    if (!linksByParentId.has(link.parentRecipeId)) linksByParentId.set(link.parentRecipeId, { ingredients: [], preparations: [] });
                    linksByParentId.get(link.parentRecipeId)!.preparations.push(link);
                });

                // Étape 2: Calculer le coût de toutes les préparations de base (tri topologique pour les dépendances)
                const costsByPrepId = new Map<string, number>();
                const sortedPreps = (() => {
                    const deps = new Map<string, string[]>();
                    const order: string[] = [];
                    const permMark = new Set<string>();
                    const tempMark = new Set<string>();

                    allPrepsAndGarnishesList.forEach(p => {
                        const prepLinks = linksByParentId.get(p.id!)?.preparations || [];
                        deps.set(p.id!, prepLinks.map(l => l.childPreparationId));
                    });

                    function visit(prepId: string) {
                        if (!prepId || !allPrepsAndGarnishes.has(prepId)) return;
                        if (permMark.has(prepId)) return;
                        if (tempMark.has(prepId)) { console.warn(`Dépendance circulaire détectée pour la préparation ID: ${prepId}`); return; }
                        
                        tempMark.add(prepId);
                        (deps.get(prepId) || []).forEach(visit);
                        tempMark.delete(prepId);
                        permMark.add(prepId);
                        order.push(prepId);
                    }

                    allPrepsAndGarnishesList.forEach(p => p.id && visit(p.id));
                    return order;
                })();

                for (const prepId of sortedPreps) {
                    const prep = allPrepsAndGarnishes.get(prepId);
                    if (!prep) continue;
                    
                    let prepTotalCost = 0;
                    const links = linksByParentId.get(prepId);

                    // Coût des ingrédients directs
                    for (const ingLink of links?.ingredients || []) {
                        const ingData = allIngredients.get(ingLink.ingredientId);
                        if (ingData) {
                            prepTotalCost += computeIngredientCost(ingData, ingLink.quantity, ingLink.unitUse).cost;
                        }
                    }
                    // Coût des sous-préparations
                    for (const subPrepLink of links?.preparations || []) {
                        const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                        const subPrepCostPerUnit = costsByPrepId.get(subPrepLink.childPreparationId) || 0;
                        if (subPrepData) {
                             const quantityInProductionUnit = subPrepLink.quantity * getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit || 'g', subPrepData);
                             prepTotalCost += quantityInProductionUnit * subPrepCostPerUnit;
                        }
                    }
                    costsByPrepId.set(prepId, (prepTotalCost / (prep.productionQuantity || 1)) || 0);
                }

                // Étape 3: Calculer le coût final pour chaque plat actif
                const enrichedDishes = activeRecipes.map(recipe => {
                    let dishTotalCost = 0;
                    const links = linksByParentId.get(recipe.id!);
                    // Coût des ingrédients directs
                    for (const ingLink of links?.ingredients || []) {
                        const ingData = allIngredients.get(ingLink.ingredientId);
                        if (ingData) {
                            dishTotalCost += computeIngredientCost(ingData, ingLink.quantity, ingLink.unitUse).cost;
                        }
                    }
                    // Coût des sous-préparations
                    for (const subPrepLink of links?.preparations || []) {
                        const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                        const subPrepCostPerUnit = costsByPrepId.get(subPrepLink.childPreparationId) || 0;
                        if(subPrepData) {
                             const quantityInProductionUnit = subPrepLink.quantity * getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit || 'g', subPrepData);
                            dishTotalCost += quantityInProductionUnit * subPrepCostPerUnit;
                        }
                    }
                    return { ...recipe, foodCost: dishTotalCost };
                });
                
                setDishes(enrichedDishes);

            } catch (e: any) {
                console.error("Failed to calculate costs:", e);
                setError("Impossible de calculer les coûts. " + e.message);
            } finally {
                setIsLoading(false);
            }
        };

        calculateAllCosts();
    }, []);


    const renderSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center h-8">
                            <Skeleton className="h-5 w-1/4" />
                             <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu (Étape 2/3)</h1>
                <p className="text-muted-foreground">Calcul du coût matière pour chaque plat actif.</p>
            </header>

            {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                renderSkeleton()
            ) : !error && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ChefHat />Plats Actifs & Coût Matière</CardTitle>
                        <CardDescription>Voici la liste des plats avec leur coût matière calculé.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du Plat</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="text-right">Prix de Vente</TableHead>
                                    <TableHead className="text-right">Coût Matière</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dishes.length > 0 ? (
                                    dishes.map(dish => (
                                        <TableRow key={dish.id}>
                                            <TableCell className="font-medium">{dish.name}</TableCell>
                                            <TableCell>{dish.category}</TableCell>
                                            <TableCell className="text-right">{dish.price.toFixed(2)} DZD</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {dish.foodCost !== undefined ? `${dish.foodCost.toFixed(2)} DZD` : 'Calcul...'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            Aucun plat actif trouvé.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
