
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Recipe } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ChefHat } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function MenuAnalysisClient() {
    const [activeDishes, setActiveDishes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActiveDishes = async () => {
            if (!isFirebaseConfigured) {
                setError("La configuration de Firebase est manquante.");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const recipesQuery = query(
                    collection(db, "recipes"), 
                    where("type", "==", "Plat"), 
                    where("status", "==", "Actif")
                );
                const querySnapshot = await getDocs(recipesQuery);
                const dishes = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
                dishes.sort((a, b) => a.name.localeCompare(b.name));
                setActiveDishes(dishes);
            } catch (e: any) {
                console.error("Failed to fetch active dishes:", e);
                setError("Impossible de charger les plats actifs. " + e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveDishes();
    }, []);

    const renderSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu (Étape 1)</h1>
                <p className="text-muted-foreground">Affichage de la liste des plats actifs. Validation de la base de données.</p>
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
                        <CardTitle className="flex items-center gap-2"><ChefHat />Plats Actifs sur le Menu</CardTitle>
                        <CardDescription>Voici la liste des plats qui seront utilisés pour les prochaines étapes de l'analyse.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du Plat</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="text-right">Prix de Vente</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeDishes.length > 0 ? (
                                    activeDishes.map(dish => (
                                        <TableRow key={dish.id}>
                                            <TableCell className="font-medium">{dish.name}</TableCell>
                                            <TableCell>{dish.category}</TableCell>
                                            <TableCell className="text-right">{dish.price.toFixed(2)} DZD</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
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
