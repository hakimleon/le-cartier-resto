
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Ingredient, Preparation, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import MenuAnalysisClient from './MenuAnalysisClient';

async function getRawData() {
    try {
        const [recipesSnap, ingredientsSnap, preparationsSnap, garnishesSnap, recipeIngsSnap, recipePrepsSnap] = await Promise.all([
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "garnishes")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks")),
        ]);

        const rawRecipes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
        const rawIngredients = ingredientsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
        const rawPreparations = preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));
        const rawGarnishes = garnishesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation));
        const rawRecipeIngredients = recipeIngsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as RecipeIngredientLink));
        const rawRecipePreps = recipePrepsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as RecipePreparationLink));
        
        return {
            rawRecipes,
            rawIngredients,
            rawPreparations,
            rawGarnishes,
            rawRecipeIngredients,
            rawRecipePreps,
            error: null
        }
    } catch (e: any) {
        console.error("Error fetching raw data for menu analysis:", e);
        return {
            rawRecipes: [],
            rawIngredients: [],
            rawPreparations: [],
            rawGarnishes: [],
            rawRecipeIngredients: [],
            rawRecipePreps: [],
            error: e.message || "Une erreur est survenue lors de la récupération des données brutes."
        }
    }
}


export default async function MenuAnalysisPage() {
    const { rawRecipes, rawIngredients, rawPreparations, rawGarnishes, rawRecipeIngredients, rawRecipePreps, error } = await getRawData();
    
    return <MenuAnalysisClient 
        rawActiveRecipes={rawRecipes}
        rawIngredients={rawIngredients}
        rawPreparations={rawPreparations}
        rawGarnishes={rawGarnishes}
        rawRecipeIngredients={rawRecipeIngredients}
        rawRecipePreps={rawRecipePreps}
        initialError={error} 
    />;
}
