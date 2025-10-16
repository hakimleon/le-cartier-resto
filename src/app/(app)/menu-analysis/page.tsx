
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Ingredient, Preparation, RecipeIngredientLink, RecipePreparationLink } from '@/lib/types';
import MenuAnalysisClient from './MenuAnalysisClient';

type ProteinCategory = 'Viandes Rouges' | 'Volailles' | 'Poissons & Fruits de Mer' | 'Végétarien';
type Accompaniment = { id: string; name: string; type: 'Garniture' | 'Préparation' };
export type AnalyzedDish = {
    id: string;
    name: string;
    proteinCategory: ProteinCategory;
    accompaniments: Accompaniment[];
};

async function getMenuAnalysisData(): Promise<{ dishes: AnalyzedDish[], error: string | null }> {
    try {
        const [
            recipesSnap,
            ingredientsSnap,
            preparationsSnap,
            garnishesSnap,
            recipeIngsSnap,
            recipePrepsSnap,
        ] = await Promise.all([
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif"))),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "garnishes")),
            getDocs(collection(db, "recipeIngredients")),
            getDocs(collection(db, "recipePreparationLinks")),
        ]);

        const allIngredients = new Map(ingredientsSnap.docs.map(doc => [doc.id, doc.data() as Ingredient]));
        const allPrepsAndGarnishes = new Map([
            ...preparationsSnap.docs.map(doc => [doc.id, doc.data() as Preparation]),
            ...garnishesSnap.docs.map(doc => [doc.id, { ...doc.data(), type: 'Garniture' } as unknown as Preparation]),
        ]);

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
        
        const analyzedDishes: AnalyzedDish[] = [];

        for (const doc of recipesSnap.docs) {
            const dish = { ...doc.data(), id: doc.id } as Recipe;
            let proteinCategory: ProteinCategory = 'Végétarien';
            const accompaniments = new Map<string, Accompaniment>();

            const queue = [dish.id];
            const visited = new Set<string>();

            while(queue.length > 0) {
                const currentId = queue.shift()!;
                if (visited.has(currentId)) continue;
                visited.add(currentId);

                const links = linksByParentId.get(currentId);
                if (!links) continue;

                for (const ingLink of links.ingredients) {
                    const ingredient = allIngredients.get(ingLink.ingredientId);
                    if (ingredient) {
                        if (ingredient.category === "Viandes & Gibiers" && proteinCategory !== 'Viandes Rouges') proteinCategory = 'Viandes Rouges';
                        else if (ingredient.category === "Volaille" && proteinCategory === 'Végétarien') proteinCategory = 'Volailles';
                        else if (ingredient.category === "Poissons & Fruits de mer" && proteinCategory === 'Végétarien') proteinCategory = 'Poissons & Fruits de Mer';
                    }
                }
                
                for (const prepLink of links.preparations) {
                     const prepOrGarnish = allPrepsAndGarnishes.get(prepLink.childPreparationId);
                     if (prepOrGarnish) {
                        const isGarnish = garnishesSnap.docs.some(d => d.id === prepLink.childPreparationId);
                        const relevantPrepCategories = ["Purées & mousselines", "Gratins & plats de légumes au four", "Céréales & féculents", "Légumineuses & accompagnements végétariens mijotés"];
                        if(isGarnish || (prepOrGarnish.category && relevantPrepCategories.includes(prepOrGarnish.category as any))) {
                            if(!accompaniments.has(prepOrGarnish.id!)) {
                                accompaniments.set(prepOrGarnish.id!, { id: prepOrGarnish.id!, name: prepOrGarnish.name, type: isGarnish ? 'Garniture' : 'Préparation' });
                            }
                        } else {
                            queue.push(prepLink.childPreparationId);
                        }
                     }
                }
            }

            analyzedDishes.push({
                id: dish.id,
                name: dish.name,
                proteinCategory,
                accompaniments: Array.from(accompaniments.values()),
            });
        }
        
        return { dishes: analyzedDishes, error: null };

    } catch (error) {
        console.error("Error analyzing menu:", error);
        return { 
            dishes: [], 
            error: error instanceof Error ? `Erreur d'analyse: ${error.message}` : "Une erreur inconnue est survenue." 
        };
    }
}


export default async function MenuAnalysisPage() {
    const { dishes, error } = await getMenuAnalysisData();
    return <MenuAnalysisClient analyzedDishes={dishes} initialError={error} />;
}
