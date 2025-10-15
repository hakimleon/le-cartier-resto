
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe, Preparation, Ingredient, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListOrdered, NotebookText, Carrot } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

async function getProductionData() {
    try {
        // 1. Fetch all necessary collections
        const [
            recipesSnap,
            preparationsSnap,
            ingredientsSnap,
            recipeIngsSnap,
            recipePrepsSnap
        ] = await Promise.all([
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks"))
        ]);
        
        const activeDishes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
        
        // Create maps for efficient lookups
        const allPreparations = new Map(preparationsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Preparation]));
        const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Ingredient]));
        
        const linksByParentId = new Map<string, { ingredients: string[], preparations: string[] }>();
        recipeIngsSnap.forEach(doc => {
            const link = doc.data() as RecipeIngredientLink;
            if (!linksByParentId.has(link.recipeId)) linksByParentId.set(link.recipeId, { ingredients: [], preparations: [] });
            linksByParentId.get(link.recipeId)!.ingredients.push(link.ingredientId);
        });
        recipePrepsSnap.forEach(doc => {
            const link = doc.data() as RecipePreparationLink;
            if (!linksByParentId.has(link.parentRecipeId)) linksByParentId.set(link.parentRecipeId, { ingredients: [], preparations: [] });
            linksByParentId.get(link.parentRecipeId)!.preparations.push(link.childPreparationId);
        });

        // 2. Resolve all dependencies
        const requiredPreparationIds = new Set<string>();
        const requiredIngredientIds = new Set<string>();
        const queue: string[] = activeDishes.map(d => d.id!); // Start with active dishes

        const processed = new Set<string>();

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (processed.has(currentId)) continue;
            processed.add(currentId);

            const links = linksByParentId.get(currentId);
            if (!links) continue;

            // Add raw ingredients
            links.ingredients.forEach(ingId => requiredIngredientIds.add(ingId));

            // Add sub-preparations and queue them for processing
            links.preparations.forEach(prepId => {
                if (allPreparations.has(prepId)) {
                    requiredPreparationIds.add(prepId);
                    if (!processed.has(prepId)) {
                        queue.push(prepId);
                    }
                }
            });
        }
        
        // 3. Get full documents for required items
        const requiredPreparations = Array.from(requiredPreparationIds)
            .map(id => allPreparations.get(id))
            .filter((p): p is Preparation => !!p)
            .sort((a,b) => a.name.localeCompare(b.name));

        const requiredIngredients = Array.from(requiredIngredientIds)
            .map(id => allIngredients.get(id))
            .filter((i): i is Ingredient => !!i)
            .sort((a,b) => a.name.localeCompare(b.name));

        return {
            activeDishes,
            requiredPreparations,
            requiredIngredients,
            error: null,
        };

    } catch (error) {
        console.error("Error fetching production data:", error);
        return {
            activeDishes: [],
            requiredPreparations: [],
            requiredIngredients: [],
            error: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        };
    }
}


export default async function ProductionPlanPage() {
    const { activeDishes, requiredPreparations, requiredIngredients, error } = await getProductionData();

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <div className="bg-muted text-muted-foreground rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                    <ListOrdered className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Plan de Production</h1>
                    <p className="text-muted-foreground">Analyse de la mise en place requise pour les plats actifs au menu.</p>
                </div>
            </header>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de chargement</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><NotebookText className="h-5 w-5"/>Préparations Requises</CardTitle>
                        <CardDescription>
                            Liste de toutes les fiches techniques (sauces, fonds, garnitures...) nécessaires pour le service.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requiredPreparations.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {requiredPreparations.map(prep => (
                                    <li key={prep.id} className="p-2 bg-background rounded-md border">{prep.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-8">Aucune préparation de base requise.</p>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Carrot className="h-5 w-5"/>Ingrédients Bruts Requis</CardTitle>
                        <CardDescription>
                            Liste consolidée de tous les ingrédients bruts à sortir pour la production.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requiredIngredients.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {requiredIngredients.map(ing => (
                                    <li key={ing.id} className="p-2 bg-background rounded-md border">{ing.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-8">Aucun ingrédient brut requis.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Plats Actifs Analysés</CardTitle>
                    <CardDescription>
                        La production est calculée sur la base de ces {activeDishes.length} plat(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeDishes.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {activeDishes.map(dish => (
                                <li key={dish.id}>{dish.name}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">Aucun plat actif trouvé.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

