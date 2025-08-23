

"use client";

import { useState, useEffect, useCallback } from "react";
import MenuClient from "./MenuClient";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/data/definitions";

export default function MenuPageLoader() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // This key is used to force a re-render of the client component
  const [key, setKey] = useState(Date.now()); 

  const getRecipes = useCallback(async () => {
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
      setRecipes([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getRecipes();
  }, [getRecipes, key]);

  const handleRefresh = () => {
    setKey(Date.now());
  };

  return <MenuClient initialRecipes={recipes} isLoading={isLoading} onRefresh={handleRefresh} />;
}
