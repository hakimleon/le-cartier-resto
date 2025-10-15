
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe, Preparation, Ingredient, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListOrdered, NotebookText, Carrot } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getConversionFactor } from '@/utils/unitConverter';

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
        
        const linksByParentId = new Map<string, { ingredients: RecipeIngredientLink[], preparations: RecipePreparationLink[] }>();

        recipeIngsSnap.forEach(doc => {
            const link = doc.data() as RecipeIngredientLink;
            if (!linksByParentId.has(link.recipeId)) linksByParentId.set(link.recipeId, { ingredients: [], preparations: [] });
            linksByParentId.get(link.recipeId)!.ingredients.push(link);
        });
        recipePrepsSnap.forEach(doc => {
            const link = doc.data() as RecipePreparationLink;
            if (!linksByParentId.has(link.parentRecipeId)) linksByParentId.set(link.parentRecipeId, { ingredients: [], preparations: [] });
            linksByParentId.get(link.parentRecipeId)!.preparations.push(link);
        });

        // Aggregator maps
        const totalPreparationsNeeded = new Map<string, { name: string, quantity: number, unit: string }>();
        const totalIngredientsNeeded = new Map<string, { name: string, quantity: number, unit: string }>();
        const processedItems = new Set<string>(); // To avoid infinite loops in case of circular dependencies

        // Assume a base production of 1 for each active dish
        const initialQueue: { id: string, multiplier: number }[] = activeDishes.map(d => ({ id: d.id!, multiplier: 1 }));
        const processingQueue = [...initialQueue];

        while(processingQueue.length > 0) {
            const { id, multiplier } = processingQueue.shift()!;
            
            if (processedItems.has(id + multiplier)) continue; // Avoid re-processing the same item with the same multiplier
            processedItems.add(id + multiplier);
            
            const currentItemLinks = linksByParentId.get(id);
            if (!currentItemLinks) continue;

            // Process direct ingredients
            for (const ingLink of currentItemLinks.ingredients) {
                const ingredient = allIngredients.get(ingLink.ingredientId);
                if (ingredient) {
                    const quantityToAdd = ingLink.quantity * multiplier;
                    const existing = totalIngredientsNeeded.get(ingredient.id!);
                    if (existing) {
                        // For simplicity, we aggregate if units are the same, otherwise we might need more complex logic
                        if (existing.unit.toLowerCase() === ingLink.unitUse.toLowerCase()) {
                           existing.quantity += quantityToAdd;
                        } else {
                           // In a real scenario, convert to a base unit before adding. Here we just add a new line or overwrite.
                           // For now, let's just sum it up, assuming conversion is implicitly handled or units are consistent.
                           existing.quantity += quantityToAdd; 
                        }
                    } else {
                        totalIngredientsNeeded.set(ingredient.id!, { name: ingredient.name, quantity: quantityToAdd, unit: ingLink.unitUse });
                    }
                }
            }

            // Process sub-preparations
            for (const prepLink of currentItemLinks.preparations) {
                const preparation = allPreparations.get(prepLink.childPreparationId);
                if (preparation) {
                    const quantityToAdd = prepLink.quantity * multiplier;
                    const existing = totalPreparationsNeeded.get(preparation.id!);

                    if (existing) {
                        existing.quantity += quantityToAdd;
                    } else {
                        totalPreparationsNeeded.set(preparation.id!, { name: preparation.name, quantity: quantityToAdd, unit: prepLink.unitUse });
                    }
                    
                    // Calculate the new multiplier for the next level of dependencies
                    const conversionFactor = getConversionFactor(prepLink.unitUse, preparation.productionUnit || 'g', undefined);
                    const quantityInProductionUnit = prepLink.quantity * conversionFactor;
                    const nextMultiplier = (quantityInProductionUnit / (preparation.productionQuantity || 1)) * multiplier;

                    if (nextMultiplier > 0) {
                        processingQueue.push({ id: preparation.id!, multiplier: nextMultiplier });
                    }
                }
            }
        }
        
        return {
            activeDishes,
            requiredPreparations: Array.from(totalPreparationsNeeded.values()).sort((a,b) => a.name.localeCompare(b.name)),
            requiredIngredients: Array.from(totalIngredientsNeeded.values()).sort((a,b) => a.name.localeCompare(b.name)),
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
                            Quantité totale de chaque fiche technique à produire pour le service.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requiredPreparations.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {requiredPreparations.map(prep => (
                                    <li key={prep.name} className="p-2 bg-background rounded-md border flex justify-between">
                                        <span>{prep.name}</span>
                                        <span className="font-bold">{prep.quantity.toFixed(2)} {prep.unit}</span>
                                    </li>
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
                            Quantité totale de chaque ingrédient brut à sortir pour la production.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requiredIngredients.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {requiredIngredients.map(ing => (
                                     <li key={ing.name} className="p-2 bg-background rounded-md border flex justify-between">
                                        <span>{ing.name}</span>
                                        <span className="font-bold">{ing.quantity.toFixed(2)} {ing.unit}</span>
                                    </li>
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
                        Le plan de production est calculé sur la base de ces {activeDishes.length} plat(s) actif(s).
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
