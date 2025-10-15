
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListOrdered } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getProductionData() {
    try {
        const activeDishesQuery = query(
            collection(db, "recipes"),
            where("type", "==", "Plat"),
            where("status", "==", "Actif")
        );

        const snapshot = await getDocs(activeDishesQuery);
        const activeDishes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));

        return {
            activeDishes,
            error: null,
        };

    } catch (error) {
        console.error("Error fetching production data:", error);
        return {
            activeDishes: [],
            error: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        };
    }
}


export default async function ProductionPlanPage() {
    const { activeDishes, error } = await getProductionData();

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

            <Card>
                <CardHeader>
                    <CardTitle>Plats Actifs Analysés</CardTitle>
                    <CardDescription>
                        La production est calculée sur la base de ces {activeDishes.length} plat(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeDishes.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
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
