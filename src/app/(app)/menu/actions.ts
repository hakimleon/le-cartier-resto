
"use server";

import { db } from "@/lib/firebase";
import { collection, doc, setDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { mockRecipes, mockRecipeIngredients } from "@/data/mock-data";
import { Recipe } from "@/data/definitions";
import { generateDishImage } from "@/ai/flows/generate-dish-image";
import fs from "fs/promises";
import path from "path";
import {v4 as uuidv4} from 'uuid';

async function saveImageLocally(imageDataUri: string): Promise<string> {
    const imageId = `${uuidv4()}.png`;
    const imagePath = path.join(process.cwd(), 'imagedata', imageId);
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(imagePath), { recursive: true });

    // Extract base64 data
    const base64Data = imageDataUri.split(';base64,').pop();
    if (!base64Data) {
        throw new Error("Invalid Data URI");
    }
    
    // Write file
    await fs.writeFile(imagePath, base64Data, 'base64');
    
    // Return the public URL
    return `/api/images/${imageId}`;
}


export async function saveDish(formData: FormData) {
    const id = formData.get('id') as string;
    const imageHint = formData.get('imageHint') as string;
    let imageUrl = formData.get('image') as string;

    const dishData: Omit<Recipe, 'id' | 'tags' | 'procedure' | 'allergens' | 'image'> = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        price: parseFloat(formData.get('price') as string),
        cost: 0, 
        imageHint: imageHint,
        prepTime: parseInt(formData.get('prepTime') as string),
        difficulty: parseInt(formData.get('difficulty') as string) as Recipe['difficulty'],
        status: formData.get('status') as Recipe['status'],
        tags: JSON.parse(formData.get('tags') as string || '[]'),
        procedure: { preparation: [], cuisson: [], service: [] },
        allergens: [],
    };

    try {
        let docRef;
        if (id) {
            docRef = doc(db, "recipes", id);
        } else {
            docRef = doc(collection(db, "recipes"));
        }
        
        if (imageHint) {
            console.log(`Generating image for: ${imageHint}`);
            const generatedDataUri = await generateDishImage({ prompt: imageHint });
            imageUrl = await saveImageLocally(generatedDataUri);
            console.log(`Image generated and stored at ${imageUrl}`);
        }
        
        const finalData: Omit<Recipe, 'id'> = {
            ...dishData,
            image: imageUrl || 'https://placehold.co/600x400.png',
        };

        await setDoc(docRef, finalData);

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
      const {
        id,
        cost: mockCost,
        imageAltText,
        cookTime,
        totalTime,
        servings,
        portionDescription,
        nutritionalInfo,
        instructions,
        marketingDescription,
        equipment,
        chef,
        createdAt,
        updatedAt,
        ...recipeToStore
      } = recipe;

      const docData: Omit<Recipe, 'id'> = {
          ...recipeToStore,
          cost: 0,
          image: `https://placehold.co/600x400.png?text=${encodeURIComponent(recipe.name)}`
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
