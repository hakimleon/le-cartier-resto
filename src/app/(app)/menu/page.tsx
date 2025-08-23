

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/data/definitions";
import { MenuClient } from "./MenuClient";


async function getRecipes(): Promise<Recipe[]> {
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    const recipeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Recipe));
    return recipeList;
}


export default async function MenuPage() {
  const recipes = await getRecipes();

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <MenuClient initialRecipes={recipes} />
    </div>
  );
}
