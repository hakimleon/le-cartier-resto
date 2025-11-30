
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient, Recipe, Preparation } from '@/lib/types';
import DashboardClient from './DashboardClient';
import { unstable_cache } from 'next/cache';

type CategoryDistribution = {
    name: string;
    value: number;
}[];

const formatCategoryForChart = (category?: string): string => {
    if (!category) return "Non classé";
    return category.split(/[-–]/)[0].trim();
};


// Utilisation de unstable_cache pour mettre en cache les données du dashboard
const getDashboardData = unstable_cache(
    async () => {
        try {
            const recipesQuery = query(collection(db, "recipes"), where("type", "==", "Plat"));
            const recipesSnapshot = await getDocs(recipesQuery);
            const allRecipes = recipesSnapshot.docs.map(doc => doc.data() as Recipe);
            const totalDishes = allRecipes.length;

            // Calculate category distribution
            const categoryMap = new Map<string, { name: string; value: number }>();

            allRecipes.forEach(recipe => {
                if (recipe.category) {
                    const formattedName = formatCategoryForChart(recipe.category);
                    const lowercasedName = formattedName.toLowerCase();

                    if (categoryMap.has(lowercasedName)) {
                        const existing = categoryMap.get(lowercasedName)!;
                        existing.value += 1;
                    } else {
                        // Use the formattedName (with original casing) for the label
                        categoryMap.set(lowercasedName, { name: formattedName, value: 1 });
                    }
                }
            });

            const categoryDistribution: CategoryDistribution = Array.from(categoryMap.values());


            const preparationsSnapshot = await getDocs(collection(db, "preparations"));
            const totalPreparations = preparationsSnapshot.size;

            const garnishesSnapshot = await getDocs(collection(db, "garnishes"));
            const totalGarnishes = garnishesSnapshot.size;

            const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
            const allIngredients = ingredientsSnapshot.docs.map(doc => doc.data() as Ingredient);
            const totalIngredients = allIngredients.length;
            
            const lowStockIngredients = (allIngredients || []).filter(
                ing => ing.stockQuantity <= ing.lowStockThreshold
            ).length;

            return { 
                totalDishes, 
                totalPreparations: totalPreparations + totalGarnishes, 
                totalIngredients, 
                lowStockIngredients,
                categoryDistribution,
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
                categoryDistribution: [],
                error: `Impossible de charger les données du tableau de bord: ${errorMessage}`
            };
        }
    },
    ['dashboard-data'], // Clé de cache unique
    { revalidate: 3600 } // Revalider toutes les heures (en secondes)
);


export default async function DashboardPage() {
    const { totalDishes, totalPreparations, totalIngredients, lowStockIngredients, categoryDistribution, error } = await getDashboardData();
    
    const stats = [
        {
            title: "Plats au Menu",
            value: totalDishes,
            icon: "chef-hat",
            description: "Nombre total de plats actifs et inactifs."
        },
        {
            title: "Fiches Techniques",
            value: totalPreparations,
            icon: "book-copy",
            description: "Préparations de base et garnitures."
        },
        {
            title: "Ingrédients",
            value: totalIngredients,
            icon: "package",
            description: "Nombre d'ingrédients dans l'inventaire."
        },
        {
            title: "Stock Critique",
            value: lowStockIngredients,
            icon: "alert-triangle",
            description: "Ingrédients en dessous du seuil d'alerte.",
            isCritical: true,
        },
    ]
  return (
    <DashboardClient stats={stats} categoryDistribution={categoryDistribution} error={error} />
  );
}
