

"use server";

import { db } from "@/lib/firebase";
import { collection, doc, setDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { mockRecipes, mockRecipeIngredients } from "@/data/mock-data";
import { Recipe } from "@/data/definitions";
import { generateDishImage, type GenerateDishImageInput } from "@/ai/flows/generate-dish-image";
import { v2 as cloudinary } from 'cloudinary';
import { z } from "zod";

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function uploadToCloudinary(imageDataUri: string, dishName: string): Promise<string> {
    try {
        const result = await cloudinary.uploader.upload(imageDataUri, {
            folder: "le-singulier-ai",
            public_id: `${dishName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            overwrite: true,
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload image to Cloudinary.");
    }
}

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

const GenerateImageSchema = z.object({
  imageHint: z.string().min(1, "La description pour l'IA est requise."),
  quantity: z.coerce.number().min(1).max(4),
  style: z.string(),
});

export async function generateDishImagesAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = GenerateImageSchema.safeParse({
    imageHint: rawData.imageHint,
    quantity: rawData.quantity,
    style: rawData.style,
  });

  if (!validatedFields.success) {
    return { success: false, message: "Données de formulaire invalides." };
  }

  try {
    const dishName = formData.get('name') as string || 'plat-inconnu';
    const generationInput: GenerateDishImageInput = {
        prompt: validatedFields.data.imageHint,
        quantity: validatedFields.data.quantity,
        style: validatedFields.data.style,
    };

    console.log(`Generating ${generationInput.quantity} image(s) for: ${generationInput.prompt}`);
    const generatedDataUris = await generateDishImage(generationInput);
    
    const uploadPromises = generatedDataUris.map(dataUri => uploadToCloudinary(dataUri, dishName));
    const imageUrls = await Promise.all(uploadPromises);

    console.log(`Images generated and uploaded to Cloudinary:`, imageUrls);
    return { success: true, data: imageUrls, message: "Images générées avec succès." };

  } catch (error) {
    console.error("Error in generateDishImagesAction:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de la génération d'images : ${errorMessage}` };
  }
}
