"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Ingredient } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, ArrowLeft, FilePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { IngredientForm } from "../IngredientForm";
import { useToast } from "@/hooks/use-toast";

type IngredientDetailClientProps = {
    ingredientId: string;
};

export default function IngredientDetailClient({ ingredientId }: IngredientDetailClientProps) {
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!ingredientId) {
            setIsLoading(false);
            setError("L'identifiant de l'ingrédient est manquant.");
            return;
        }
        if (!isFirebaseConfigured) {
            setError("La configuration de Firebase est manquante.");
            setIsLoading(false);
            return;
        }

        const fetchIngredient = async () => {
            try {
                setIsLoading(true);
                const ingredientDocRef = doc(db, "ingredients", ingredientId);
                const ingredientSnap = await getDoc(ingredientDocRef);

                if (!ingredientSnap.exists()) {
                    setError("Ingrédient non trouvé.");
                    setIngredient(null);
                    setIsLoading(false);
                    return;
                }

                const fetchedIngredient = { ...ingredientSnap.data(), id: ingredientSnap.id } as Ingredient;
                setIngredient(fetchedIngredient);
                setError(null);
            } catch (e: any) {
                console.error("Error fetching ingredient: ", e);
                setError("Impossible de charger l'ingrédient. " + e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIngredient();
    }, [ingredientId]);

    const handleSuccess = async (updatedIngredient?: Ingredient) => {
        if (updatedIngredient) {
            // Recharger les données depuis Firebase pour s'assurer qu'on a les dernières données
            try {
                const ingredientDocRef = doc(db, "ingredients", ingredientId);
                const ingredientSnap = await getDoc(ingredientDocRef);
                if (ingredientSnap.exists()) {
                    const fetchedIngredient = { ...ingredientSnap.data(), id: ingredientSnap.id } as Ingredient;
                    setIngredient(fetchedIngredient);
                } else {
                    setIngredient(updatedIngredient);
                }
            } catch (e) {
                console.error("Error refreshing ingredient:", e);
                setIngredient(updatedIngredient);
            }
            setIsEditing(false);
            toast({
                title: "Succès",
                description: "L'ingrédient a été mis à jour.",
            });
        }
    };

    if (isLoading) {
        return <IngredientDetailSkeleton />;
    }

    if (error) {
        return (
            <div className="container mx-auto py-10">
                <Alert variant="destructive" className="max-w-2xl mx-auto my-10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!ingredient) {
        return (
            <div className="container mx-auto py-10 text-center">
                <p>Ingrédient non trouvé ou erreur de chargement.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4 flex-grow">
                    <div className="bg-primary/10 text-primary rounded-lg h-14 w-14 flex items-center justify-center shrink-0">
                        <Package className="h-7 w-7" />
                    </div>
                    <div className="w-full">
                        <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">
                            {ingredient.name}
                        </h1>
                        <p className="text-muted-foreground">{ingredient.category || 'Non catégorisé'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />Retour
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? (
                            <>
                                <FilePen className="mr-2 h-4 w-4" />Annuler
                            </>
                        ) : (
                            <>
                                <FilePen className="mr-2 h-4 w-4" />Modifier
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {isEditing ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Modifier l'ingrédient</CardTitle>
                        <CardDescription>
                            Modifiez les détails de l'ingrédient ci-dessous.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IngredientForm ingredient={ingredient} onSuccess={handleSuccess} />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de l'ingrédient</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nom</p>
                                <p className="font-semibold">{ingredient.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Catégorie</p>
                                <p className="font-semibold">{ingredient.category || 'Non spécifiée'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Stock actuel</p>
                                <p className="font-semibold">{ingredient.stockQuantity || 0} {ingredient.baseUnit || 'g'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Seuil d'alerte</p>
                                <p className="font-semibold">{ingredient.lowStockThreshold || 0} {ingredient.baseUnit || 'g'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Prix d'achat</p>
                                <p className="font-semibold">{ingredient.purchasePrice?.toFixed(2) || '0.00'} DZD</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unité d'achat</p>
                                <p className="font-semibold">{ingredient.purchaseUnit || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Poids/Volume unité d'achat</p>
                                <p className="font-semibold">{ingredient.purchaseWeightGrams || 0} {ingredient.baseUnit === 'ml' ? 'ml' : 'g'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rendement</p>
                                <p className="font-semibold">{ingredient.yieldPercentage || 100}%</p>
                            </div>
                            {ingredient.supplier && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Fournisseur</p>
                                    <p className="font-semibold">{ingredient.supplier}</p>
                                </div>
                            )}
                        </div>
                        {ingredient.equivalences && Object.keys(ingredient.equivalences).length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground mb-2">Table d'équivalence</p>
                                <div className="border rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(ingredient.equivalences).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="text-sm">{key}:</span>
                                                <span className="text-sm font-semibold">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function IngredientDetailSkeleton() {
    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-grow">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-10 w-24" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

