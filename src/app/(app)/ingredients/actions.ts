
"use server";

import { ingredients } from "@/data/data-cache";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function seedIngredients() {
  try {
    const ingredientsCollection = collection(db, "ingredients");
    const batch = writeBatch(db);

    ingredients.forEach((ingredient) => {
      // Use the existing string ID for the new document ID
      const docRef = doc(ingredientsCollection, ingredient.id);
      batch.set(docRef, ingredient);
    });

    await batch.commit();
    
    // Revalidate the ingredients page to show the new data
    revalidatePath("/ingredients");

    return { success: true, message: `${ingredients.length} ingrédients ont été ajoutés à Firestore.` };
  } catch (error) {
    console.error("Error seeding ingredients:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de l'initialisation : ${errorMessage}` };
  }
}
