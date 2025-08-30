
'use server';

import { collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/lib/types';

/**
 * Migrates existing recipes to include the `type: 'Plat'` field.
 * This is useful for data structure updates.
 * @returns The number of recipes updated.
 */
export async function migrateRecipesToPlat(): Promise<number> {
  try {
    const recipesRef = collection(db, 'recipes');
    
    // We fetch documents that do NOT have the 'type' field.
    // Firestore doesn't have a "field does not exist" query, so we fetch all and filter client-side.
    // This is acceptable for a one-time migration script.
    const q = query(recipesRef);
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    let updatedCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data() as Partial<Recipe>;
      // If the 'type' field is missing, we add it to the batch update.
      if (!data.type) {
        batch.update(doc.ref, { type: 'Plat' });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updatedCount} recipes.`);
    } else {
      console.log("No recipes needed updating.");
    }
    
    return updatedCount;
  } catch (error) {
    console.error("Error migrating recipes: ", error);
    // Re-throw the error to be caught by the client component
    if (error instanceof Error) {
        throw new Error(`Failed to migrate recipes: ${error.message}`);
    }
    throw new Error("An unknown error occurred during migration.");
  }
}
