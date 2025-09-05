
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient, Recipe, Preparation } from '@/lib/types';
import DashboardClient from './DashboardClient';
import { BookCopy, ChefHat, Package, AlertTriangle } from 'lucide-react';

async function getDashboardData() {
    try {
        const recipesQuery = query(collection(db, "recipes"), where("type", "==", "Plat"));
        const recipesSnapshot = await getDocs(recipesQuery);
        const totalDishes = recipesSnapshot.size;

        const preparationsSnapshot = await getDocs(collection(db, "preparations"));
        const totalPreparations = preparationsSnapshot.size;

        const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
        const allIngredients = ingredientsSnapshot.docs.map(doc => doc.data() as Ingredient);
        const totalIngredients = allIngredients.length;
        
        const lowStockIngredients = allIngredients.filter(
            ing => ing.stockQuantity <= ing.lowStockThreshold
        ).length;

        return { 
            totalDishes, 
            totalPreparations, 
            totalIngredients, 
            lowStockIngredients,
            error: null 
        };

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        return { 
            totalDishes: 0, 
            totalPreparations: 0, 
            totalIngredients: 0, 
            lowStockIngredients: 0,
            error: `Impossible de charger les données du tableau de bord: ${errorMessage}`
        };
    }
}


export default async function DashboardPage() {
    const { totalDishes, totalPreparations, totalIngredients, lowStockIngredients, error } = await getDashboardData();
    
    const stats = [
        {
            title: "Plats au Menu",
            value: totalDishes,
            icon: ChefHat,
            description: "Nombre total de plats actifs et inactifs."
        },
        {
            title: "Préparations",
            value: totalPreparations,
            icon: BookCopy,
            description: "Nombre de fiches techniques de base."
        },
        {
            title: "Ingrédients",
            value: totalIngredients,
            icon: Package,
            description: "Nombre d'ingrédients dans l'inventaire."
        },
        {
            title: "Stock Critique",
            value: lowStockIngredients,
            icon: AlertTriangle,
            description: "Ingrédients en dessous du seuil d'alerte.",
            isCritical: true,
        },
    ]
  return (
    <div className="container mx-auto py-10">
        <DashboardClient stats={stats} error={error} />
    </div>
  );
}
