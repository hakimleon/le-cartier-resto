
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
    recipes: [
        {
          id: 'ef-2',
          name: 'Caprice Méditerranéen',
          description: 'Duo de tomate et mozzarella aux herbes fraîches',
          category: 'Entrées Froides – Fraîcheur et Élégance',
          price: 1200,
          cost: 480,
          image: 'https://placehold.co/600x400.png',
          imageHint: 'caprese salad',
          prepTime: 10,
          difficulty: 1,
          status: 'Actif',
          tags: ['Végétarien'],
          portionSize: '1 assiette / 200g',
          calories: 250,
          procedure: {
              preparation: [
                  'Couper les tomates en rondelles régulières.',
                  'Alterner les tranches de tomate et de mozzarella sur une assiette.',
                  'Ajouter des feuilles de basilic frais.'
              ],
              cuisson: [],
              service: [
                  'Assaisonner d’un filet d’huile d’olive, sel et poivre.'
              ]
          },
          allergens: ['Lactose'],
          notes: 'Privilégier une mozzarella de bufflonne et des tomates bien mûres pour un goût optimal.',
          argumentationCommerciale: "Je vous conseille ce grand classique de la cuisine méditerranéenne : l’alliance des tomates mûres, de la mozzarella fondante et du basilic frais, relevée d’une touche d’huile d’olive. C’est une entrée fraîche, légère et pleine de soleil."
        },
        {
          id: 'pg-16',
          name: 'Filet Majestueux des Prairies',
          description: 'Filet de bœuf grillé au jus réduit, purée truffée en option',
          price: 3200,
          cost: 1600,
          category: 'Plats et Grillades – Saveurs en Majesté',
          image: 'https://placehold.co/600x400.png',
          imageHint: 'beef fillet',
          prepTime: 30,
          status: 'Actif',
          difficulty: 4,
          tags: [],
          procedure: {
              preparation: ["Proposer une purée maison à l'huile de truffe en accompagnement."],
              cuisson: ["Griller le filet de boeuf à la cuisson désirée."],
              service: ["Servir avec un jus de viande réduit."]
          },
          allergens: [],
        },
    ],
    recipeIngredients: [
        { id: 'ri-4', recipeId: 'ef-2', ingredientId: 'ing-1', quantity: 150, unitUse: 'g' },
        { id: 'ri-5', recipeId: 'ef-2', ingredientId: 'ing-2', quantity: 125, unitUse: 'g' },
        { id: 'ri-6', recipeId: 'ef-2', ingredientId: 'ing-3', quantity: 0.1, unitUse: 'botte' },
        { id: 'ri-17', recipeId: 'pg-16', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
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

    const recipesCollection = collection(db, "recipes");
    seedDataSource.recipes.forEach((recipe) => {
      const docRef = doc(recipesCollection, recipe.id);
      batch.set(docRef, recipe);
    });

    const recipeIngredientsCollection = collection(db, "recipeIngredients");
    seedDataSource.recipeIngredients.forEach((ri) => {
      const docRef = doc(recipeIngredientsCollection, ri.id);
      batch.set(docRef, ri);
    });
    
    const tablesCollection = collection(db, "tables");
    seedDataSource.tables.forEach((table) => {
        // Firestore document IDs must be strings
        const docRef = doc(tablesCollection, String(table.id));
        batch.set(docRef, table);
    });


    await batch.commit();
    
    revalidatePath("/ingredients");
    revalidatePath("/menu");
    revalidatePath("/recipe-cost");
    revalidatePath("/reservations");

    return { success: true, message: `${seedDataSource.ingredients.length} ingrédients et autres données ont été ajoutés.` };
  } catch (error) {
    console.error("Error seeding ingredients:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de l'initialisation : ${errorMessage}` };
  }
}
