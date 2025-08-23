

"use client";

import { useState, useEffect } from "react";
import MenuClient from "./MenuClient";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/data/definitions";

export default function MenuPageLoader() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getRecipes() {
      setIsLoading(true);
      try {
        const recipesCol = collection(db, "recipes");
        const q = query(recipesCol, orderBy("name"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setRecipes([]);
        } else {
          const recipeList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          } as Recipe));
          setRecipes(recipeList);
        }
      } catch(error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    getRecipes();
  }, []);

  return <MenuClient initialRecipes={recipes} isLoading={isLoading} />;
}
