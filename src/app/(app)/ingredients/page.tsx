
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ingredient } from "@/data/data-cache";
import { IngredientsList } from "./IngredientsList";

async function getIngredients(): Promise<Ingredient[]> {
    // Note: For a real application, you'd implement proper error handling and possibly pagination.
    const ingredientsCol = collection(db, "ingredients");
    const q = query(ingredientsCol, orderBy("name"));
    const ingredientsSnapshot = await getDocs(q);
    const ingredientsList = ingredientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Ingredient));
    return ingredientsList;
}

export default async function IngredientsPage() {
  const ingredients = await getIngredients();

  return (
    <div className="flex flex-col h-full">
       <AppHeader title="Inventaire des Ingrédients">
        {/* The button to add is now inside the client component to handle state */}
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <IngredientsList initialIngredients={ingredients} />
      </main>
    </div>
  );
}
