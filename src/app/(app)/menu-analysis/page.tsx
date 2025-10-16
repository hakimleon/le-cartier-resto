
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Ingredient, RecipeIngredientLink } from '@/lib/types';
import MenuAnalysisClient from './MenuAnalysisClient';
import { computeIngredientCost } from '@/utils/unitConverter';

// --- Définition des types de données pour l'analyse ---

export type SummaryData = {
    totalDishes: number;
    averageDuration: number;
    categoryCount: Record<string, number>;
};

export type ProductionData = {
    id: string;
    name: string;
    category: string;
    duration: number;
    duration_breakdown: { mise_en_place: number; cuisson: number; envoi: number; };
    keyIngredients: string[];
    subRecipes: string[];
    foodCost: number;
    price: number;
};

// --- Logique de récupération et d'analyse des données ---

async function getAnalysisData(): Promise<{ summary: SummaryData; production: ProductionData[], error: string | null }> {
    try {
        const [recipesSnap, ingredientsSnap, recipeIngsSnap, recipePrepsSnap] = await Promise.all([
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks")),
        ]);

        const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Ingredient]));
        const allIngredientLinks = recipeIngsSnap.docs.map(doc => doc.data() as RecipeIngredientLink);
        
        // --- Volet 1: Calcul du Résumé (Summary) ---
        const totalDishes = recipesSnap.size;
        let totalDuration = 0;
        const categoryCount: Record<string, number> = {};

        recipesSnap.forEach(doc => {
            const recipe = doc.data() as Recipe;
            totalDuration += recipe.duration || 0;
            if(recipe.category) {
                categoryCount[recipe.category] = (categoryCount[recipe.category] || 0) + 1;
            }
        });

        const summary: SummaryData = {
            totalDishes,
            averageDuration: totalDishes > 0 ? totalDuration / totalDishes : 0,
            categoryCount,
        };

        // --- Volet 2: Calcul de la Vue Production ---
        const production: ProductionData[] = recipesSnap.docs.map(doc => {
            const recipe = { ...doc.data(), id: doc.id } as Recipe;

            // Heuristique pour le découpage de la durée
            let breakdown = recipe.duration_breakdown;
            if (!breakdown) {
                const d = recipe.duration || 0;
                if (d <= 15) breakdown = { mise_en_place: 5, cuisson: d > 5 ? d-5 : 0, envoi: 2 };
                else if (d <= 45) breakdown = { mise_en_place: d * 0.2, cuisson: d * 0.7, envoi: d * 0.1 };
                else breakdown = { mise_en_place: d * 0.6, cuisson: d * 0.3, envoi: d * 0.1 };
            }

            // Ingrédients et Coût
            const dishIngredientsLinks = allIngredientLinks.filter(l => l.recipeId === recipe.id);
            let foodCost = 0;
            const dishIngredientsWithCost = dishIngredientsLinks.map(link => {
                const ingData = allIngredients.get(link.ingredientId);
                if (ingData) {
                    const { cost } = computeIngredientCost(ingData, link.quantity, link.unitUse);
                    foodCost += cost;
                    return { name: ingData.name, cost };
                }
                return { name: 'Ingrédient inconnu', cost: 0 };
            }).filter(Boolean);

            const keyIngredients = dishIngredientsWithCost
                .sort((a,b) => b.cost - a.cost)
                .slice(0, 3)
                .map(i => i.name);
            
            return {
                id: recipe.id,
                name: recipe.name,
                category: recipe.category,
                duration: recipe.duration || 0,
                duration_breakdown: breakdown,
                keyIngredients: keyIngredients,
                subRecipes: [], // A implémenter dans une prochaine étape
                foodCost: foodCost / (recipe.portions || 1), // Coût par portion
                price: recipe.price || 0,
            };
        });

        return { summary, production, error: null };

    } catch (error) {
        console.error("Error analyzing menu:", error);
        return {
            summary: { totalDishes: 0, averageDuration: 0, categoryCount: {} },
            production: [],
            error: error instanceof Error ? `Erreur d'analyse: ${error.message}` : "Une erreur inconnue est survenue."
        };
    }
}

export default async function MenuAnalysisPage() {
    const { summary, production, error } = await getAnalysisData();
    
    return <MenuAnalysisClient summary={summary} productionData={production} initialError={error} />;
}
