
"use server";

import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// This is a temporary data source for seeding.
// In a real app, this might come from a CSV file or an external system.
const seedDataSource = {
    ingredients: [
        { id: 'ing-1', name: "Tomate Grappe", category: "Légumes", unitPurchase: "kg", unitPrice: 350, stockQuantity: 20, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 5 },
        { id: 'ing-2', name: "Mozzarella di Bufala", category: "Fromages", unitPurchase: "kg", unitPrice: 2200, stockQuantity: 5, supplier: "Metro Cash & Carry", lowStockThreshold: 2 },
        { id: 'ing-3', name: "Basilic Frais", category: "Herbes aromatiques", unitPurchase: "botte", unitPrice: 100, stockQuantity: 10, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 3 },
        { id: 'ing-4', name: "Filet de Boeuf", category: "Viandes et volailles", unitPurchase: "kg", unitPrice: 4500, stockQuantity: 10, supplier: "Boucherie Moderne El Biar", lowStockThreshold: 3 },
        { id: 'ing-5', name: "Parmesan Reggiano", category: "Fromages", unitPurchase: "kg", unitPrice: 3000, stockQuantity: 8, supplier: "Metro Cash & Carry", lowStockThreshold: 1 },
        { id: 'ing-6', name: "Roquette", category: "Légumes", unitPurchase: "kg", unitPrice: 800, stockQuantity: 3, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
        { id: 'ing-7', name: "Filet de Saumon", category: "Poissons et fruits de mer", unitPurchase: "kg", unitPrice: 3800, stockQuantity: 7, supplier: "Poissonnerie La Sirène", lowStockThreshold: 2 },
        { id: 'ing-8', name: "Crevettes Roses", category: "Poissons et fruits de mer", unitPurchase: "kg", unitPrice: 2500, stockQuantity: 4, supplier: "Poissonnerie La Sirène", lowStockThreshold: 1 },
        { id: 'ing-9', name: "Pâtes Penne", category: "Céréales", unitPurchase: "kg", unitPrice: 400, stockQuantity: 50, supplier: "Metro Cash & Carry", lowStockThreshold: 10 },
        { id: 'ing-10', name: "Piment Rouge", category: "Épices", unitPurchase: "kg", unitPrice: 1200, stockQuantity: 2, supplier: "Épices du Monde Bab Ezzouar", lowStockThreshold: 0.5 },
        { id: 'ing-11', name: "Chocolat Noir 70%", category: "Desserts", unitPurchase: "kg", unitPrice: 2500, stockQuantity: 6, supplier: "Metro Cash & Carry", lowStockThreshold: 2 },
        { id: 'ing-12', name: "Crème liquide 35%", category: "Produits laitiers", unitPurchase: "L", unitPrice: 800, stockQuantity: 10, supplier: "Metro Cash & Carry", lowStockThreshold: 3 },
        { id: 'ing-13', name: "Oeuf de poule", category: "Œufs", unitPurchase: "pièce", unitPrice: 30, stockQuantity: 120, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 24 },
        { id: 'ing-14', name: "Farine T55", category: "Céréales", unitPurchase: "kg", unitPrice: 150, stockQuantity: 30, supplier: "Metro Cash & Carry", lowStockThreshold: 5 },
        { id: 'ing-15', name: "Sucre semoule", category: "Desserts", unitPurchase: "kg", unitPrice: 180, stockQuantity: 40, supplier: "Metro Cash & Carry", lowStockThreshold: 10 },
    ],
    tables: [
        { id: 1, seats: 2, status: 'available', shape: 'round' },
        { id: 2, seats: 4, status: 'occupied', shape: 'square' },
        { id: 3, seats: 2, status: 'reserved', shape: 'round' },
        { id: 4, seats: 6, status: 'available', shape: 'square' },
        { id: 5, seats: 4, status: 'available', shape: 'round' },
        { id: 6, seats: 8, status: 'occupied', shape: 'square' },
    ]
}


export async function seedIngredients() {
  try {
    const batch = writeBatch(db);

    const ingredientsCollection = collection(db, "ingredients");
    seedDataSource.ingredients.forEach((ingredient) => {
      const docRef = doc(ingredientsCollection, ingredient.id);
      batch.set(docRef, ingredient);
    });
    
    const tablesCollection = collection(db, "tables");
    seedDataSource.tables.forEach((table) => {
        // Firestore document IDs must be strings
        const docRef = doc(tablesCollection, String(table.id));
        batch.set(docRef, table);
    });


    await batch.commit();
    
    revalidatePath("/ingredients");
    revalidatePath("/reservations");

    return { success: true, message: `${seedDataSource.ingredients.length} ingrédients ont été ajoutés.` };
  } catch (error) {
    console.error("Error seeding ingredients:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de l'initialisation : ${errorMessage}` };
  }
}
