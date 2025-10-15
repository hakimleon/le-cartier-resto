
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/lib/types';
import ProductionPlanClient from './ProductionPlanClient';

async function getActiveDishes() {
    try {
        const recipesSnap = await getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"), where("status", "==", "Actif")));
        const activeDishes = recipesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe)).sort((a, b) => a.name.localeCompare(b.name));
        return { activeDishes, error: null };
    } catch (error) {
        console.error("Error fetching active dishes for production plan:", error);
        return {
            activeDishes: [],
            error: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        };
    }
}

export default async function ProductionPlanPage() {
    const { activeDishes, error } = await getActiveDishes();
    
    return <ProductionPlanClient activeDishes={activeDishes} initialError={error} />;
}
