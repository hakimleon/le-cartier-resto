

"use server";

import { db } from "@/lib/firebase";
import { collection, doc, setDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { mockRecipes, mockRecipeIngredients } from "@/data/mock-data";
import { Recipe } from "@/data/definitions";
import { generateDishImage, type GenerateDishImageInput } from "@/ai/flows/generate-dish-image";
import { z } from "zod";

export async function saveDish(formData: FormData) {
    const id = formData.get('id') as string;
    let imageUrl = formData.get('image') as string;
    const dishName = formData.get('name') as string;

    const dishData: Omit<Recipe, 'id' | 'tags' | 'procedure' | 'allergens' | 'image' | 'imageHint'> = {
        name: dishName,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        price: parseFloat(formData.get('price') as string),
        cost: 0, 
        prepTime: parseInt(formData.get('prepTime') as string),
        difficulty: parseInt(formData.get('difficulty') as string) as Recipe['difficulty'],
        status: formData.get('status') as Recipe['status'],
    };

    try {
        let docRef;
        if (id) {
            docRef = doc(db, "recipes", id);
        } else {
            docRef = doc(collection(db, "recipes"));
        }
        
        const finalData: Omit<Recipe, 'id'> = {
            ...dishData,
            image: imageUrl || 'https://placehold.co/600x400.png',
            imageHint: formData.get('imageHint') as string,
            tags: JSON.parse(formData.get('tags') as string || '[]'),
            procedure: { preparation: [], cuisson: [], service: [] },
            allergens: [],
        };

        await setDoc(docRef, finalData, { merge: true });

        revalidatePath("/menu");
        return { success: true, message: `Plat "${dishData.name}" sauvegardé.` };

    } catch (error) {
        console.error("Error saving dish:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Erreur lors de la sauvegarde : ${errorMessage}` };
    }
}

export async function deleteDish(id: string) {
    try {
        const docRef = doc(db, "recipes", id);
        await deleteDoc(docRef);
        
        revalidatePath("/menu");
        return { success: true, message: "Plat supprimé avec succès." };
    } catch (error) {
        console.error("Error deleting dish:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Erreur lors de la suppression : ${errorMessage}` };
    }
}

export async function seedRecipes() {
  try {
    const batch = writeBatch(db);

    const recipesCollection = collection(db, "recipes");
    mockRecipes.forEach((recipe) => {
      // The id is used for the document reference, but should not be in the document data itself.
      const { id, ...recipeData } = recipe;
      
      const docData: Omit<Recipe, 'id'> = {
          ...recipeData,
          cost: recipeData.cost || 0, // Ensure cost is a number, default to 0
          image: recipeData.image || `https://placehold.co/600x400.png?text=${encodeURIComponent(recipeData.name)}`,
      };

      const docRef = doc(recipesCollection, id);
      batch.set(docRef, docData);
    });

    const recipeIngredientsCollection = collection(db, "recipeIngredients");
    mockRecipeIngredients.forEach((ri) => {
      const docRef = doc(recipeIngredientsCollection, ri.id);
      batch.set(docRef, ri);
    });

    await batch.commit();
    
    revalidatePath("/menu");
    revalidatePath("/recipe-cost");

    return { success: true, message: `${mockRecipes.length} recettes ont été ajoutées.` };
  } catch (error) {
    console.error("Error seeding recipes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de l'initialisation : ${errorMessage}` };
  }
}

const GenerateImageSchema = z.object({
  imageHint: z.string().min(1, "La description pour l'IA est requise."),
});

export async function generateDishImageAction(formData: FormData): Promise<{ success: boolean; data?: any; message: string; }> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = GenerateImageSchema.safeParse({
    imageHint: rawData.imageHint,
  });

  if (!validatedFields.success) {
    return { success: false, message: "Données de formulaire invalides." };
  }

  try {
    const generationInput: GenerateDishImageInput = {
        prompt: validatedFields.data.imageHint,
    };

    const result = await generateDishImage(generationInput);
    
    // The AI flow now returns an object { imageUrl: "data:..." }. We need to adapt.
    // Let's wrap it in an array to maintain compatibility with the multi-image modal,
    // even though we only expect one image now.
    const imageUrls = result.imageUrl ? [result.imageUrl] : [];

    return { success: true, data: imageUrls, message: "Image générée avec succès." };

  } catch (error) {
    console.error("Error in generateDishImageAction:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de la génération d'images : ${errorMessage}` };
  }
}
