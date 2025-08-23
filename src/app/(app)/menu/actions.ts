
"use server";

import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// This is a temporary data source for seeding.
const seedDataSource = {
    recipes: [
        // --- Entrées Froides ---
        {
          id: 'ef-2', name: 'Caprice Méditerranéen', description: 'Duo de tomate et mozzarella aux herbes fraîches',
          category: 'Entrées Froides – Fraîcheur et Élégance', price: 1200, cost: 480, image: 'https://placehold.co/600x400.png', imageHint: 'caprese salad', prepTime: 10, difficulty: 1, status: 'Actif', tags: ['Végétarien'],
          procedure: { preparation: ['Couper les tomates en rondelles régulières.','Alterner les tranches de tomate et de mozzarella sur une assiette.','Ajouter des feuilles de basilic frais.'], cuisson: [], service: ['Assaisonner d’un filet d’huile d’olive, sel et poivre.'] },
          allergens: ['Lactose'], argumentationCommerciale: "Un grand classique de la cuisine méditerranéenne : l’alliance des tomates mûres, de la mozzarella fondante et du basilic frais, relevée d’une touche d’huile d’olive. C’est une entrée fraîche, légère et pleine de soleil."
        },
        {
          id: 'ef-3', name: 'Trio de Verrines Fraîcheur', description: 'Assortiment de gaspacho de concombre, crème d’avocat-citron vert et tartare de saumon',
          category: 'Entrées Froides – Fraîcheur et Élégance', price: 1600, cost: 650, image: 'https://placehold.co/600x400.png', imageHint: 'fresh verrines', prepTime: 20, difficulty: 2, status: 'Actif', tags: [],
          procedure: { preparation: ['Préparer chaque composition séparément.', 'Dresser harmonieusement dans trois verrines.'], cuisson: [], service: ['Servir très frais avec une tuile de pain.'] },
          allergens: ['Poisson', 'Gluten (tuile)'], argumentationCommerciale: "Laissez-vous surprendre par cette farandole de fraîcheur : un gaspacho de concombre vivifiant, une crème d’avocat onctueuse et un tartare de saumon délicatement relevé. Une entrée parfaite pour éveiller vos papilles en douceur."
        },
        // --- Entrées Chaudes ---
        {
          id: 'ec-2', name: 'Cœur Fondant au Chèvre', description: 'Croustillant de feuille de brick, chèvre chaud au miel et thym, lit de roquette',
          category: 'Entrées Chaudes – Gourmandise et Chaleur', price: 1400, cost: 550, image: 'https://placehold.co/600x400.png', imageHint: 'goat cheese pasty', prepTime: 15, difficulty: 2, status: 'Actif', tags: ['Végétarien'],
          procedure: { preparation: ['Envelopper le chèvre dans la feuille de brick avec miel et thym.'], cuisson: ['Dorer au four ou à la poêle.'], service: ['Dresser sur un lit de roquette avec quelques noix.'] },
          allergens: ['Gluten', 'Lactose', 'Fruits à coque'], argumentationCommerciale: "Imaginez le croustillant de la feuille de brick qui révèle un cœur de chèvre fondant, adouci par une touche de miel et parfumé au thym. Une entrée chaude et réconfortante, pleine de contrastes et de saveurs."
        },
        // --- Plats et Grillades ---
        {
          id: 'pg-16', name: 'Filet Majestueux des Prairies', description: 'Filet de bœuf grillé au jus réduit, purée truffée en option',
          category: 'Plats et Grillades – Saveurs en Majesté', price: 3200, cost: 1600, image: 'https://placehold.co/600x400.png', imageHint: 'beef fillet', prepTime: 30, status: 'Actif', difficulty: 4, tags: [],
          procedure: { preparation: ["Proposer une purée maison à l'huile de truffe en accompagnement."], cuisson: ["Griller le filet de boeuf à la cuisson désirée."], service: ["Servir avec un jus de viande réduit."] },
          allergens: [], argumentationCommerciale: "Pour les amateurs de viande d’exception : un filet de bœuf incroyablement tendre, grillé à la perfection et nappé d’un jus corsé. Accompagnez-le de notre purée à la truffe pour une expérience inoubliable."
        },
        {
            id: 'pg-14', name: 'Le Confit du Sud-Ouest', description: "Cuisse de canard confite maison, pommes de terre sarladaises",
            category: 'Plats et Grillades – Saveurs en Majesté', price: 2800, cost: 1200, image: 'https://placehold.co/600x400.png', imageHint: 'duck confit', prepTime: 25, difficulty: 3, status: 'Actif', tags: ['Spécialité locale'],
            procedure: { preparation: ["Rissoler les pommes de terre avec ail et persil."], cuisson: ["Réchauffer la cuisse de canard côté peau jusqu'à ce qu'elle soit croustillante."], service: ["Dresser harmonieusement."] },
            allergens: [], argumentationCommerciale: "Un voyage gourmand dans le Sud-Ouest avec cette cuisse de canard confite par nos soins, à la peau dorée et croustillante et à la chair fondante. Ses pommes de terre sarladaises à l'ail et au persil vous transporteront."
        },
        // --- Mets de chez nous ---
        {
            id: 'lmdcn-2', name: 'Rechta Royale Algéroise', description: 'Fines nouilles vapeur, poulet fermier, navets et pois chiches dans un bouillon délicat à la cannelle',
            category: 'Les Mets de chez Nous', price: 2200, cost: 800, image: 'https://placehold.co/600x400.png', imageHint: 'algerian rechta', prepTime: 45, difficulty: 3, status: 'Actif', tags: ['Spécialité locale', 'Halal'],
            procedure: { preparation: ['Cuire les légumes et le poulet dans le bouillon.', 'Cuire la rechta à la vapeur.'], cuisson: [], service: ['Servir la rechta nappée de bouillon, avec poulet et légumes.'] },
            allergens: ['Gluten'], argumentationCommerciale: "Découvrez la finesse de la cuisine algéroise avec notre Rechta, des pâtes fraîches légères comme un nuage, accompagnées de poulet fermier et de légumes fondants dans un bouillon subtilement parfumé à la cannelle. Un plat emblématique plein de délicatesse."
        },
        // --- Pâtes ---
        {
          id: 'sp-7', name: 'Linguine aux Fruits de Mer', description: 'Linguine fraîches, gambas, moules, calamars, sauce tomate et ail',
          category: 'Symphonie de Pâtes – Évasion Italienne', price: 2600, cost: 1100, image: 'https://placehold.co/600x400.png', imageHint: 'seafood linguine', prepTime: 25, difficulty: 3, status: 'Actif', tags: ['Populaire'],
          procedure: { preparation: ['Faire revenir les fruits de mer avec ail et piment.', 'Déglacer au vin blanc, ajouter la sauce tomate.'], cuisson: ['Cuire les linguine al dente.'], service: ['Mélanger les pâtes à la sauce et servir chaud.'] },
          allergens: ['Gluten', 'Crustacés', 'Mollusques'], argumentationCommerciale: "Une véritable plongée dans la Méditerranée ! Nos linguine fraîches s’enrobent d’une sauce généreuse aux fruits de mer, avec des gambas juteuses, des moules et des calamars tendres. Un plat riche en saveurs marines."
        },
        // --- Burgers ---
        {
          id: 'burg-1', name: 'Le Singulier Burger', description: 'Steak de bœuf maturé, cheddar affiné, oignons caramélisés, sauce maison, frites fraîches',
          category: 'Nos Burgers Bistronomiques', price: 1900, cost: 850, image: 'https://placehold.co/600x400.png', imageHint: 'gourmet burger', prepTime: 20, difficulty: 2, status: 'Actif', tags: ['Populaire'],
          procedure: { preparation: ['Monter le burger dans l\\\'ordre : pain, sauce, salade, steak, cheddar, oignons, pain.'], cuisson: ['Cuire le steak à la cuisson désirée.'], service: ['Servir avec des frites fraîches.'] },
          allergens: ['Gluten', 'Lactose', 'Sésame (pain)'], argumentationCommerciale: "Oubliez tout ce que vous savez sur les burgers. Le nôtre est une pièce de bistronomie : viande de bœuf maturée, cheddar de caractère, oignons confits et notre sauce secrète, servis avec des frites fraîches. C’est le burger dans toute sa noblesse."
        },
        // --- Desserts ---
        {
          id: 'des-1', name: 'Tentation Chocolat-Passion', description: 'Dôme chocolat noir, cœur coulant passion, crumble cacao',
          category: 'Douceurs Signature – Éclats Sucrés de l’Instant', price: 1300, cost: 500, image: 'https://placehold.co/600x400.png', imageHint: 'chocolate dome dessert', prepTime: 25, difficulty: 4, status: 'Actif', tags: ['Nouveau'],
          procedure: { preparation: ['Monter les dômes et les congeler.', 'Préparer le crumble.'], cuisson: [], service: ['Dresser le dôme sur le crumble, servir immédiatement.'] },
          allergens: ['Lactose', 'Œuf', 'Gluten (crumble)'], argumentationCommerciale: "Terminez votre repas sur une note intense et exotique. Ce dôme de chocolat noir croquant renferme un cœur liquide et acidulé à la passion, le tout reposant sur un crumble au cacao. L’équilibre parfait entre puissance et fraîcheur."
        },
    ],
    recipeIngredients: [
        { id: 'ri-4', recipeId: 'ef-2', ingredientId: 'ing-1', quantity: 150, unitUse: 'g' },
        { id: 'ri-5', recipeId: 'ef-2', ingredientId: 'ing-2', quantity: 125, unitUse: 'g' },
        { id: 'ri-6', recipeId: 'ef-2', ingredientId: 'ing-3', quantity: 0.1, unitUse: 'botte' },
        { id: 'ri-17', recipeId: 'pg-16', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    ],
}

export async function seedRecipes() {
  try {
    const batch = writeBatch(db);

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

    await batch.commit();
    
    revalidatePath("/menu");
    revalidatePath("/recipe-cost");

    return { success: true, message: `${seedDataSource.recipes.length} recettes ont été ajoutées.` };
  } catch (error) {
    console.error("Error seeding recipes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de l'initialisation : ${errorMessage}` };
  }
}
