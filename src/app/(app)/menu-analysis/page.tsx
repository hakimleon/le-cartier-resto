
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
    duration: number;
    duration_breakdown: { mise_en_place: number; cuisson: number; envoi: number; };
    keyIngredients: string[];
    subRecipes: string[];
    foodCost: number; // Coût matière par portion
    grossMargin: number; // Marge brute par portion
    yieldPerMin: number; // Rendement en €/min
    price: number;
};

export type MutualisationData = {
  id: string;
  name: string;
  count: number;
  usedIn: string[];
  frequency: 'Quotidienne' | 'Fréquente' | 'Occasionnelle';
}


// --- Logique de récupération et d'analyse des données ---
async function getAnalysisData(): Promise<{ summary: SummaryData; production: ProductionData[], mutualisations: MutualisationData[], error: string | null }> {
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

        // --- Volet 1: Calcul du Résumé (Summary) ---
        const summary: SummaryData = {
            totalDishes: recipesSnap.size,
            averageDuration: recipesSnap.docs.reduce((acc, doc) => acc + (doc.data().duration || 0), 0) / (recipesSnap.size || 1),
            categoryCount: recipesSnap.docs.reduce((acc, doc) => {
                const cat = doc.data().category || 'Non classé';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
        
        // --- Calcul des coûts de toutes les préparations ---
        const prepCosts = new Map<string, number>(); // Map<prepId, costPerProductionUnit>

        const sortedPreps = (() => {
            const deps = new Map<string, string[]>();
            const order: string[] = [];
            const visited = new Set<string>();
            allPrepsAndGarnishesList.forEach(p => {
                const prepLinks = allRecipePreps.get(p.id!) || [];
                deps.set(p.id!, prepLinks.map(l => l.childPreparationId));
            });

            function visit(prepId: string) {
                if (visited.has(prepId)) return;
                visited.add(prepId);
                (deps.get(prepId) || []).forEach(visit);
                order.push(prepId);
            }
            allPrepsAndGarnishesList.forEach(p => visit(p.id!));
            return order;
        })();

        for (const prepId of sortedPreps) {
            const prep = allPrepsAndGarnishes.get(prepId);
            if (!prep) continue;
            
            let totalCost = 0;
            // Coût des ingrédients directs de la préparation
            const directIngredients = allRecipeIngredients.get(prepId) || [];
            for (const ingLink of directIngredients) {
                const ingData = allIngredients.get(ingLink.ingredientId);
                if (ingData) totalCost += computeIngredientCost(ingData, ingLink.quantity, ingLink.unitUse).cost;
            }

            // Coût des sous-préparations de la préparation
            const subPreps = allRecipePreps.get(prepId) || [];
            for (const subPrepLink of subPreps) {
                const subPrepData = allPrepsAndGarnishes.get(subPrepLink.childPreparationId);
                const costPerUnit = prepCosts.get(subPrepLink.childPreparationId) || 0;
                if (subPrepData) {
                    const factor = getConversionFactor(subPrepLink.unitUse, subPrepData.productionUnit!, subPrepData);
                    totalCost += (subPrepLink.quantity * factor) * costPerUnit;
                }
            }
            const costPerProductionUnit = totalCost / (prep.productionQuantity || 1);
            prepCosts.set(prepId, costPerProductionUnit);
        }

        // --- Volets 2, 3 et 5: Production, Mutualisations et Rentabilité ---
        const mutualisationMap = new Map<string, { name: string, usedIn: Set<string> }>();
        const production: ProductionData[] = [];

        for (const doc of recipesSnap.docs) {
            const recipe = { ...doc.data(), id: doc.id } as Recipe;

            // Calcul du coût matière total pour ce plat
            let dishTotalCost = 0;
            const dishIngredients = allRecipeIngredients.get(recipe.id) || [];
            dishIngredients.forEach(link => {
                const ingData = allIngredients.get(link.ingredientId);
                if(ingData) dishTotalCost += computeIngredientCost(ingData, link.quantity, link.unitUse).cost;
            });
            
            const dishSubPreps = allRecipePreps.get(recipe.id) || [];
            dishSubPreps.forEach(link => {
                const prepData = allPrepsAndGarnishes.get(link.childPreparationId);
                const costPerUnit = prepCosts.get(link.childPreparationId) || 0;
                if (prepData) {
                    const factor = getConversionFactor(link.unitUse, prepData.productionUnit!, prepData);
                    dishTotalCost += (link.quantity * factor) * costPerUnit;
                }
            });

            const foodCostPerPortion = dishTotalCost / (recipe.portions || 1);
            const priceHT = recipe.price / (1 + (recipe.tvaRate || 10) / 100);
            const grossMargin = priceHT - foodCostPerPortion;
            const yieldPerMin = recipe.duration ? grossMargin / recipe.duration : 0;

            let breakdown = recipe.duration_breakdown;
            if (!breakdown) {
                const d = recipe.duration || 0;
                breakdown = d <= 15 ? { mise_en_place: 5, cuisson: d > 5 ? d-5 : 0, envoi: 2 } : d <= 45 ? { mise_en_place: d * 0.2, cuisson: d * 0.7, envoi: d * 0.1 } : { mise_en_place: d * 0.6, cuisson: d * 0.3, envoi: d * 0.1 };
            }
            
            const subRecipeNames = dishSubPreps.map(sr => {
                const prep = allPrepsAndGarnishes.get(sr.childPreparationId);
                if(prep) {
                    if(!mutualisationMap.has(prep.id!)) mutualisationMap.set(prep.id!, { name: prep.name, usedIn: new Set() });
                    mutualisationMap.get(prep.id!)!.usedIn.add(recipe.name);
                    return prep.name;
                }
                return 'Préparation inconnue';
            });
            
            production.push({
                id: recipe.id,
                name: recipe.name,
                category: recipe.category,
                duration: recipe.duration || 0,
                duration_breakdown: breakdown,
                keyIngredients: (allRecipeIngredients.get(recipe.id) || []).slice(0, 3).map(l => allIngredients.get(l.ingredientId)?.name || ''),
                subRecipes: subRecipeNames,
                foodCost: foodCostPerPortion,
                grossMargin: grossMargin,
                yieldPerMin: yieldPerMin,
                price: recipe.price || 0,
            });
        };
        
        const mutualisations = Array.from(mutualisationMap.values())
            .filter(m => m.usedIn.size >= 2)
            .map(m => {
                let freq: MutualisationData['frequency'] = 'Occasionnelle';
                if(m.usedIn.size >= 4) freq = 'Quotidienne';
                else if (m.usedIn.size >= 2) freq = 'Fréquente';
                return {
                    id: m.name, // Simple ID for now
                    name: m.name,
                    count: m.usedIn.size,
                    usedIn: Array.from(m.usedIn),
                    frequency: freq,
                };
            }).sort((a,b) => b.count - a.count);

        return { summary, production, mutualisations, error: null };

    } catch (error) {
        console.error("Error analyzing menu:", error);
        return {
            summary: { totalDishes: 0, averageDuration: 0, categoryCount: {} },
            production: [],
            mutualisations: [],
            error: error instanceof Error ? `Erreur d'analyse: ${error.message}` : "Une erreur inconnue est survenue."
        };
    }
}

export default async function MenuAnalysisPage() {
    const { summary, production, mutualisations, error } = await getAnalysisData();
    
    return <MenuAnalysisClient summary={summary} productionData={production} mutualisationData={mutualisations} initialError={error} />;
}
