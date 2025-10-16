

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Ingredient, Preparation, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import MenuAnalysisClient from './MenuAnalysisClient';
import { getConversionFactor, computeIngredientCost } from '@/utils/unitConverter';

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
    duration: number; // Durée PONDÉRÉE pour la charge de travail du service
    duration_breakdown: { mise_en_place: number; cuisson: number; envoi: number; };
    foodCost: number; // Coût matière par portion
    grossMargin: number; // Marge brute par portion
    yieldPerMin: number; // Rendement en €/min
    price: number;
    mode_preparation?: 'avance' | 'minute' | 'mixte';
};

export type MutualisationData = {
  id: string;
  name: string;
  dishCount: number;
  dishes: string[];
  frequency: 'Quotidienne' | 'Fréquente' | 'Occasionnelle';
}

export type PlanningTask = {
    heure: string;
    poste: string;
    tache: string;
    duree: number;
    priorite: number;
}

export type PerformanceData = {
    commonPreparationsCount: number;
    averageMargin: number;
    averageMepTime: number;
    complexityRate: number;
    menuBalance: Record<string, number>;
};

// --- Logique de récupération et d'analyse des données ---
async function getAnalysisData(): Promise<{ summary: SummaryData; production: ProductionData[], mutualisations: MutualisationData[], performance: PerformanceData, error: string | null }> {
    try {
        const [recipesSnap, ingredientsSnap, preparationsSnap, garnishesSnap, recipeIngsSnap, recipePrepsSnap] = await Promise.all([
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "garnishes")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks")),
        ]);

        const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as Ingredient]));
        
        const allPrepsAndGarnishesList = [
            ...preparationsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation)),
            ...garnishesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Preparation)),
        ];
        const allPrepsAndGarnishes = new Map(allPrepsAndGarnishesList.map(p => [p.id!, p]));
        
        const allRecipeIngredients = new Map<string, RecipeIngredientLink[]>();
        recipeIngsSnap.forEach(doc => {
            const link = doc.data() as RecipeIngredientLink;
            if (!allRecipeIngredients.has(link.recipeId)) allRecipeIngredients.set(link.recipeId, []);
            allRecipeIngredients.get(link.recipeId)!.push(link);
        });

        const allRecipePreps = new Map<string, RecipePreparationLink[]>();
        recipePrepsSnap.forEach(doc => {
            const link = doc.data() as RecipePreparationLink;
            if (!allRecipePreps.has(link.parentRecipeId)) allRecipePreps.set(link.parentRecipeId, []);
            allRecipePreps.get(link.parentRecipeId)!.push(link);
        });

        const activeRecipes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
        
        // --- Calcul des coûts de toutes les préparations (avec détection de cycle) ---
        const prepCosts = new Map<string, number>(); // Map<prepId, costPerProductionUnit>

        const sortedPreps = (() => {
            const deps = new Map<string, string[]>();
            const order: string[] = [];
            const permMark = new Set<string>();
            const tempMark = new Set<string>();

            allPrepsAndGarnishesList.forEach(p => {
                const prepLinks = allRecipePreps.get(p.id!) || [];
                deps.set(p.id!, prepLinks.map(l => l.childPreparationId));
            });

            function visit(prepId: string) {
                if (permMark.has(prepId)) return;
                if (tempMark.has(prepId)) {
                    console.warn(`Circular dependency detected in cost calculation at prep ID: ${prepId}`);
                    return; // Cycle detected
                }
                if (!allPrepsAndGarnishes.has(prepId)) return;
                
                tempMark.add(prepId);
                (deps.get(prepId) || []).forEach(visit);
                tempMark.delete(prepId);
                permMark.add(prepId);
                order.push(prepId);
            }
            allPrepsAndGarnishesList.forEach(p => visit(p.id!));
            return order;
        })();
        
        for (const prepId of sortedPreps) {
            const prep = allPrepsAndGarnishes.get(prepId);
            if (!prep) continue;
            
            let totalCost = 0;
            const directIngredients = allRecipeIngredients.get(prepId) || [];
            for (const ingLink of directIngredients) {
                const ingData = allIngredients.get(ingLink.ingredientId);
                if (ingData) totalCost += computeIngredientCost(ingData, ingLink.quantity, ingLink.unitUse).cost;
            }

            const subPreps = allRecipePreps.get(prepId) || [];
            for (const subPrepLink of subPreps) {
                const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                const costPerUnit = prepCosts.get(subPrepLink.childPreparationId) || 0;
                if (subPrepData) {
                    const factor = getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit!, subPrepData);
                    totalCost += (subPrepLink.quantity * factor) * costPerUnit;
                }
            }
            const costPerProductionUnit = (prep.productionQuantity && prep.productionQuantity > 0) ? totalCost / prep.productionQuantity : 0;
            prepCosts.set(prepId, isNaN(costPerProductionUnit) ? 0 : costPerProductionUnit);
        }

        // --- Volets 2, 3 et 5: Production, Mutualisations et Rentabilité ---
        const prepUsageCount = new Map<string, { name: string, dishes: string[] }>();
        const production: ProductionData[] = [];

        // Helper function to calculate weighted duration with memoization and cycle detection
        const weightedDurationCache = new Map<string, number>();
        const getWeightedDuration = (itemId: string, itemType: 'recipe' | 'prep', visited = new Set<string>()): number => {
            if (visited.has(itemId)) {
                console.warn(`Circular dependency detected for duration calculation at item ID: ${itemId}`);
                return 0; // Break cycle
            }
            if (weightedDurationCache.has(itemId)) {
                return weightedDurationCache.get(itemId)!;
            }

            visited.add(itemId);
            const item = itemType === 'recipe' ? activeRecipes.find(r => r.id === itemId) : allPrepsAndGarnishes.get(itemId);
            if (!item) {
                visited.delete(itemId);
                return 0;
            }
            
            let weightedTime = 0;
            const mode = item.mode_preparation || (item.type === 'Plat' ? 'minute' : 'avance');
            const itemDuration = item.duration || 0;

            if (mode === 'minute') weightedTime += itemDuration;
            else if (mode === 'mixte') weightedTime += itemDuration * 0.5;

            const subPreps = allRecipePreps.get(item.id!) || [];
            for (const subPrepLink of subPreps) {
                weightedTime += getWeightedDuration(subPrepLink.childPreparationId, 'prep', visited);
            }
            
            visited.delete(itemId);
            weightedDurationCache.set(itemId, weightedTime);
            return weightedTime;
        };


        for (const recipe of activeRecipes) {
            let dishTotalCost = 0;
            const dishIngredients = allRecipeIngredients.get(recipe.id) || [];
            dishIngredients.forEach(link => {
                const ingData = allIngredients.get(link.ingredientId);
                if(ingData && ingData.purchasePrice > 0 && ingData.purchaseWeightGrams > 0) {
                     dishTotalCost += computeIngredientCost(ingData, link.quantity, link.unitUse).cost;
                }
            });
            
            const dishSubPreps = allRecipePreps.get(recipe.id) || [];
            dishSubPreps.forEach(link => {
                const prepData = allPrepsAndGarnishes.get(link.childPreparationId);
                const costPerUnit = prepCosts.get(link.childPreparationId) || 0;
                if (prepData) {
                    if (!prepUsageCount.has(prepData.id!)) prepUsageCount.set(prepData.id!, { name: prepData.name, dishes: [] });
                    prepUsageCount.get(prepData.id!)!.dishes.push(recipe.name);
                    
                    const factor = getConversionFactor(link.unitUse, prepData.productionUnit!, prepData);
                    dishTotalCost += (link.quantity * factor) * costPerUnit;
                }
            });

            const foodCostPerPortion = dishTotalCost / (recipe.portions || 1);
            const priceHT = (recipe.price || 0) / (1 + (recipe.tvaRate || 10) / 100);
            const grossMargin = priceHT - foodCostPerPortion;
            
            const weightedDuration = getWeightedDuration(recipe.id!, 'recipe');
            const yieldPerMin = weightedDuration > 0 ? grossMargin / weightedDuration : 0;

            let breakdown = recipe.duration_breakdown;
            if (!breakdown) {
                const d = recipe.duration || 0;
                breakdown = d <= 15 ? { mise_en_place: 5, cuisson: d > 5 ? d-5 : 0, envoi: 2 } : d <= 45 ? { mise_en_place: d * 0.2, cuisson: d * 0.7, envoi: d * 0.1 } : { mise_en_place: d * 0.6, cuisson: d * 0.3, envoi: d * 0.1 };
            }
            
            production.push({
                id: recipe.id, name: recipe.name, category: recipe.category,
                duration: weightedDuration,
                duration_breakdown: breakdown,
                foodCost: foodCostPerPortion, grossMargin: grossMargin, yieldPerMin: yieldPerMin,
                price: recipe.price || 0, mode_preparation: recipe.mode_preparation,
            });
        };
        
        const mutualisations: MutualisationData[] = [];
        for (const [id, data] of prepUsageCount.entries()) {
            if (data.dishes.length >= 2) {
                let freq: MutualisationData['frequency'] = 'Occasionnelle';
                if (data.dishes.length >= 4) freq = 'Quotidienne';
                else if (data.dishes.length >= 2) freq = 'Fréquente';

                mutualisations.push({ id, name: data.name, dishCount: data.dishes.length, dishes: data.dishes, frequency: freq });
            }
        }
        mutualisations.sort((a,b) => b.dishCount - a.dishCount);

        const summary: SummaryData = {
            totalDishes: activeRecipes.length,
            averageDuration: production.reduce((acc, p) => acc + p.duration, 0) / (production.length || 1),
            categoryCount: activeRecipes.reduce((acc, doc) => {
                const cat = doc.category || 'Non classé';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };

        const totalGrossMargin = production.reduce((acc, p) => acc + p.grossMargin, 0);
        const totalMepTime = production.reduce((acc, p) => acc + p.duration_breakdown.mise_en_place, 0);
        const difficultDishes = activeRecipes.filter(r => r.difficulty === 'Difficile').length;

        const performanceData: PerformanceData = {
            commonPreparationsCount: mutualisations.length,
            averageMargin: totalGrossMargin / (production.length || 1),
            averageMepTime: totalMepTime / (production.length || 1),
            complexityRate: (difficultDishes / (activeRecipes.length || 1)) * 100,
            menuBalance: summary.categoryCount
        };


        return { summary, production, mutualisations, performance: performanceData, error: null };

    } catch (error) {
        console.error("Error analyzing menu:", error);
        return {
            summary: { totalDishes: 0, averageDuration: 0, categoryCount: {} },
            production: [], mutualisations: [],
            performance: { commonPreparationsCount: 0, averageMargin: 0, averageMepTime: 0, complexityRate: 0, menuBalance: {} },
            error: error instanceof Error ? `Erreur d'analyse: ${error.message}` : "Une erreur inconnue est survenue."
        };
    }
}

export default async function MenuAnalysisPage() {
    const { summary, production, mutualisations, performance, error } = await getAnalysisData();
    
    return <MenuAnalysisClient summary={summary} productionData={production} mutualisationData={mutualisations} performanceData={performance} initialError={error} />;
}
