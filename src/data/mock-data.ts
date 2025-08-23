
// src/data/mock-data.ts
import { Recipe, RecipeIngredient } from './definitions';

export const mockRecipes: Omit<Recipe, 'cost' | 'argumentationCommerciale'>[] = [
  // --- Entrées Froides ---
  {
    id: 'ef-1', name: 'Salade César "Le Singulier"', description: 'Notre version signature de la célèbre salade, poulet grillé, croûtons à l’ail et copeaux de parmesan',
    category: 'Entrées Froides – Fraîcheur et Élégance', price: 1500, image: 'https://placehold.co/600x400.png', imageHint: 'caesar salad', prepTime: 15, difficulty: 2, status: 'Actif', tags: ['Populaire'],
    procedure: { preparation: ['Laver et essorer la laitue.', 'Couper le poulet en lanières.', 'Préparer les croûtons.'], cuisson: ['Griller le poulet.'], service: ['Mélanger tous les ingrédients avec la sauce César et dresser.'] },
    allergens: ['Gluten', 'Lactose', 'Poisson (sauce)']
  },
  {
    id: 'ef-2', name: 'Caprice Méditerranéen', description: 'Duo de tomate et mozzarella di Bufala aux herbes fraîches, pesto maison',
    category: 'Entrées Froides – Fraîcheur et Élégance', price: 1300, image: 'https://placehold.co/600x400.png', imageHint: 'caprese salad', prepTime: 10, difficulty: 1, status: 'Actif', tags: ['Végétarien'],
    procedure: { preparation: ['Couper les tomates et la mozzarella en rondelles.', 'Alterner les tranches sur une assiette.', 'Préparer le pesto.'], cuisson: [], service: ['Arroser de pesto et d’un filet d’huile d’olive, décorer de basilic.'] },
    allergens: ['Lactose', 'Fruits à coque (pesto)']
  },
  {
    id: 'ef-3', name: 'Trio de Verrines Fraîcheur', description: 'Assortiment de gaspacho de concombre, crème d’avocat-citron vert et tartare de saumon',
    category: 'Entrées Froides – Fraîcheur et Élégance', price: 1600, image: 'https://placehold.co/600x400.png', imageHint: 'fresh verrines', prepTime: 20, difficulty: 2, status: 'Actif', tags: [],
    procedure: { preparation: ['Préparer chaque composition séparément.', 'Dresser harmonieusement dans trois verrines.'], cuisson: [], service: ['Servir très frais avec une tuile de pain.'] },
    allergens: ['Poisson', 'Gluten (tuile)']
  },
  {
    id: 'ef-4', name: 'Carpaccio de Bœuf "Cipriani"', description: 'Fines tranches de bœuf mariné, roquette, copeaux de parmesan, sauce "Cipriani"',
    category: 'Entrées Froides – Fraîcheur et Élégance', price: 1800, image: 'https://placehold.co/600x400.png', imageHint: 'beef carpaccio', prepTime: 12, difficulty: 3, status: 'Actif', tags: [],
    procedure: { preparation: [' Mariner le boeuf.', 'Disposer les tranches de bœuf sur l’assiette.'], cuisson: [], service: ['Ajouter la roquette, les copeaux de parmesan et la sauce.'] },
    allergens: ['Lactose', 'Œuf (sauce)']
  },
  // --- Entrées Chaudes ---
  {
    id: 'ec-1', name: 'Velouté de Saison', description: 'Soupe onctueuse selon les légumes du marché, croûtons et crème',
    category: 'Entrées Chaudes – Gourmandise et Chaleur', price: 1100, image: 'https://placehold.co/600x400.png', imageHint: 'vegetable soup', prepTime: 15, difficulty: 1, status: 'Saisonnier', tags: ['Végétarien'],
    procedure: { preparation: ['Laver et couper les légumes.'], cuisson: ['Cuire les légumes dans un bouillon, puis mixer.'], service: ['Servir chaud avec croûtons et un filet de crème.'] },
    allergens: ['Lactose', 'Gluten (croûtons)']
  },
  {
    id: 'ec-2', name: 'Cœur Fondant au Chèvre', description: 'Croustillant de feuille de brick, chèvre chaud au miel et thym, lit de roquette',
    category: 'Entrées Chaudes – Gourmandise et Chaleur', price: 1400, image: 'https://placehold.co/600x400.png', imageHint: 'goat cheese pasty', prepTime: 15, difficulty: 2, status: 'Actif', tags: ['Végétarien'],
    procedure: { preparation: ['Envelopper le chèvre dans la feuille de brick avec miel et thym.'], cuisson: ['Dorer au four ou à la poêle.'], service: ['Dresser sur un lit de roquette avec quelques noix.'] },
    allergens: ['Gluten', 'Lactose', 'Fruits à coque']
  },
  {
    id: 'ec-3', name: 'Gambas Flambées au Pastis', description: 'Grosses crevettes décortiquées et flambées, persillade à l’ail',
    category: 'Entrées Chaudes – Gourmandise et Chaleur', price: 2100, image: 'https://placehold.co/600x400.png', imageHint: 'flambeed prawns', prepTime: 18, difficulty: 3, status: 'Actif', tags: [],
    procedure: { preparation: ['Décortiquer les gambas.', 'Préparer la persillade.'], cuisson: ['Saisir les gambas à la poêle, déglacer et flamber au pastis.'], service: ['Servir immédiatement avec la persillade.'] },
    allergens: ['Crustacés']
  },
  // --- Plats et Grillades ---
  {
    id: 'pg-1', name: 'Filet Majestueux des Prairies', description: 'Filet de bœuf grillé (200g), jus corsé au thym, purée truffée',
    category: 'Plats et Grillades – Saveurs en Majesté', price: 3500, image: 'https://placehold.co/600x400.png', imageHint: 'beef fillet truffle', prepTime: 30, status: 'Actif', difficulty: 4, tags: ['Populaire'],
    procedure: { preparation: ["Préparer la purée à l'huile de truffe.", "Préparer le jus de viande."], cuisson: ["Griller le filet de boeuf à la cuisson désirée."], service: ["Dresser le filet avec la purée et napper de jus."] },
    allergens: ['Lactose (purée)']
  },
  {
      id: 'pg-2', name: 'Le Confit du Sud-Ouest', description: "Cuisse de canard confite maison, pommes de terre sarladaises à l'ail et persil",
      category: 'Plats et Grillades – Saveurs en Majesté', price: 2800, image: 'https://placehold.co/600x400.png', imageHint: 'duck confit potatoes', prepTime: 25, difficulty: 3, status: 'Actif', tags: ['Spécialité locale'],
      procedure: { preparation: ["Rissoler les pommes de terre avec ail et persil."], cuisson: ["Réchauffer la cuisse de canard côté peau jusqu'à ce qu'elle soit croustillante."], service: ["Dresser harmonieusement."] },
      allergens: []
  },
  {
      id: 'pg-3', name: 'Épaule d’Agneau de 7 Heures', description: 'Épaule d’agneau confite lentement, jus à l’ail et romarin, gratin dauphinois',
      category: 'Plats et Grillades – Saveurs en Majesté', price: 3200, image: 'https://placehold.co/600x400.png', imageHint: 'lamb shoulder gratin', prepTime: 420, difficulty: 4, status: 'Actif', tags: [],
      procedure: { preparation: ["Préparer le gratin dauphinois."], cuisson: ["Cuire l'épaule d'agneau à basse température pendant 7 heures."], service: ["Servir une portion de l'épaule effilochée avec son jus et le gratin."] },
      allergens: ['Lactose (gratin)']
  },
  // --- Mets de chez nous ---
  {
      id: 'lmdcn-1', name: 'Couscous Royal "Le Singulier"', description: 'Semoule fine, bouillon parfumé, brochette d’agneau, merguez, pilon de poulet et légumes de saison',
      category: 'Les Mets de chez Nous', price: 2500, image: 'https://placehold.co/600x400.png', imageHint: 'royal couscous', prepTime: 60, difficulty: 3, status: 'Actif', tags: ['Spécialité locale', 'Halal', 'Populaire'],
      procedure: { preparation: ['Cuire les viandes.', 'Préparer le bouillon et cuire les légumes.', 'Rouler la semoule.'], cuisson: ['Cuire la semoule à la vapeur.'], service: ['Servir chaud en présentant les viandes, la semoule et le bouillon séparément.'] },
      allergens: ['Gluten (semoule)']
  },
  {
      id: 'lmdcn-2', name: 'Rechta Royale Algéroise', description: 'Fines nouilles vapeur, poulet fermier, navets et pois chiches dans un bouillon délicat à la cannelle',
      category: 'Les Mets de chez Nous', price: 2200, image: 'https://placehold.co/600x400.png', imageHint: 'algerian rechta', prepTime: 45, difficulty: 3, status: 'Actif', tags: ['Spécialité locale', 'Halal'],
      procedure: { preparation: ['Cuire les légumes et le poulet dans le bouillon.', 'Cuire la rechta à la vapeur.'], cuisson: [], service: ['Servir la rechta nappée de bouillon, avec poulet et légumes.'] },
      allergens: ['Gluten']
  },
  // --- Pâtes ---
  {
    id: 'sp-1', name: 'Linguine aux Fruits de Mer', description: 'Linguine fraîches, gambas, moules, calamars, sauce tomate et ail',
    category: 'Symphonie de Pâtes – Évasion Italienne', price: 2600, image: 'https://placehold.co/600x400.png', imageHint: 'seafood linguine', prepTime: 25, difficulty: 3, status: 'Actif', tags: ['Populaire'],
    procedure: { preparation: ['Faire revenir les fruits de mer avec ail et piment.', 'Déglacer au vin blanc, ajouter la sauce tomate.'], cuisson: ['Cuire les linguine al dente.'], service: ['Mélanger les pâtes à la sauce et servir chaud.'] },
    allergens: ['Gluten', 'Crustacés', 'Mollusques']
  },
  {
    id: 'sp-2', name: 'Penne all’Arrabbiata', description: 'Penne, sauce tomate relevée au piment, ail et basilic frais',
    category: 'Symphonie de Pâtes – Évasion Italienne', price: 1600, image: 'https://placehold.co/600x400.png', imageHint: 'penne arrabbiata', prepTime: 20, difficulty: 1, status: 'Actif', tags: ['Végétarien', 'Épicé'],
    procedure: { preparation: ['Préparer la sauce tomate pimentée.'], cuisson: ['Cuire les penne al dente.'], service: ['Mélanger les pâtes à la sauce et saupoudrer de parmesan.'] },
    allergens: ['Gluten', 'Lactose (optionnel)']
  },
  // --- Burgers ---
  {
    id: 'burg-1', name: 'Le Singulier Burger', description: 'Steak de bœuf maturé, cheddar affiné, oignons caramélisés, sauce maison, frites fraîches',
    category: 'Nos Burgers Bistronomiques', price: 2200, image: 'https://placehold.co/600x400.png', imageHint: 'gourmet burger', prepTime: 20, difficulty: 2, status: 'Actif', tags: ['Populaire'],
    procedure: { preparation: ['Monter le burger dans l\'ordre : pain, sauce, salade, steak, cheddar, oignons, pain.'], cuisson: ['Cuire le steak à la cuisson désirée.'], service: ['Servir avec des frites fraîches.'] },
    allergens: ['Gluten', 'Lactose', 'Sésame (pain)']
  },
  {
    id: 'burg-2', name: 'Le Végétarien Gourmand', description: 'Galette de pois chiches et légumes, halloumi grillé, sauce yaourt aux herbes',
    category: 'Nos Burgers Bistronomiques', price: 1900, image: 'https://placehold.co/600x400.png', imageHint: 'veggie burger', prepTime: 25, difficulty: 2, status: 'Actif', tags: ['Végétarien'],
    procedure: { preparation: ['Préparer la galette de légumes.', 'Griller le halloumi.'], cuisson: ['Cuire la galette.'], service: ['Monter le burger et servir avec une salade.'] },
    allergens: ['Gluten', 'Lactose']
  },
  // --- Desserts ---
  {
    id: 'des-1', name: 'Tentation Chocolat-Passion', description: 'Dôme chocolat noir, cœur coulant passion, crumble cacao',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant', price: 1300, image: 'https://placehold.co/600x400.png', imageHint: 'chocolate dome dessert', prepTime: 25, difficulty: 4, status: 'Actif', tags: ['Nouveau'],
    procedure: { preparation: ['Monter les dômes et les congeler.', 'Préparer le crumble.'], cuisson: [], service: ['Dresser le dôme sur le crumble, servir immédiatement.'] },
    allergens: ['Lactose', 'Œuf', 'Gluten (crumble)']
  },
  {
    id: 'des-2', name: 'Tiramisu Classique revisité', description: 'Mascarpone onctueux, biscuit cuillère imbibé au café, cacao amer',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant', price: 1100, image: 'https://placehold.co/600x400.png', imageHint: 'tiramisu classic', prepTime: 20, difficulty: 2, status: 'Actif', tags: ['Populaire'],
    procedure: { preparation: ['Préparer la crème mascarpone.', 'Imbiber les biscuits.', 'Monter le tiramisu en couches.'], cuisson: [], service: ['Laisser reposer au frais, saupoudrer de cacao avant de servir.'] },
    allergens: ['Gluten', 'Lactose', 'Œuf']
  },
  {
    id: 'des-3', name: 'Symphonie de Fruits Rouges', description: 'Fruits rouges frais de saison, sorbet basilic maison, tuile aux amandes',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant', price: 1400, image: 'https://placehold.co/600x400.png', imageHint: 'red fruits dessert', prepTime: 15, difficulty: 1, status: 'Saisonnier', tags: ['Sans gluten'],
    procedure: { preparation: ['Préparer le sorbet.', 'Laver et préparer les fruits.'], cuisson: ['Cuire les tuiles.'], service: ['Dresser harmonieusement les fruits avec une quenelle de sorbet et la tuile.'] },
    allergens: ['Fruits à coque (amandes)']
  }
];


export const mockRecipeIngredients: RecipeIngredient[] = [
  // Salade César "Le Singulier" (ef-1)
  { id: 'ri-1', recipeId: 'ef-1', ingredientId: 'ing-4', quantity: 150, unitUse: 'g' }, // Poulet
  { id: 'ri-2', recipeId: 'ef-1', ingredientId: 'ing-6', quantity: 100, unitUse: 'g' }, // Roquette (pour laitue romaine)
  { id: 'ri-3', recipeId: 'ef-1', ingredientId: 'ing-5', quantity: 30, unitUse: 'g' }, // Parmesan
  
  // Caprice Méditerranéen (ef-2)
  { id: 'ri-4', recipeId: 'ef-2', ingredientId: 'ing-1', quantity: 150, unitUse: 'g' },
  { id: 'ri-5', recipeId: 'ef-2', ingredientId: 'ing-2', quantity: 125, unitUse: 'g' },
  { id: 'ri-6', recipeId: 'ef-2', ingredientId: 'ing-3', quantity: 0.1, unitUse: 'botte' },
  
  // Trio de Verrines Fraîcheur (ef-3)
  { id: 'ri-7', recipeId: 'ef-3', ingredientId: 'ing-7', quantity: 50, unitUse: 'g' }, // Saumon
  
  // Filet Majestueux des Prairies (pg-1)
  { id: 'ri-17', recipeId: 'pg-1', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
  { id: 'ri-18', recipeId: 'pg-1', ingredientId: 'ing-12', quantity: 50, unitUse: 'ml' }, // Crème pour purée
  
  // Linguine aux Fruits de Mer (sp-1)
  { id: 'ri-25', recipeId: 'sp-1', ingredientId: 'ing-9', quantity: 120, unitUse: 'g' }, // Pâtes
  { id: 'ri-26', recipeId: 'sp-1', ingredientId: 'ing-8', quantity: 100, unitUse: 'g' }, // Crevettes
  { id: 'ri-27', recipeId: 'sp-1', ingredientId: 'ing-1', quantity: 100, unitUse: 'g' }, // Tomate pour sauce
  
  // Le Singulier Burger (burg-1)
  { id: 'ri-30', recipeId: 'burg-1', ingredientId: 'ing-4', quantity: 180, unitUse: 'g' }, // Bœuf pour steak
  { id: 'ri-31', recipeId: 'burg-1', ingredientId: 'ing-2', quantity: 40, unitUse: 'g' }, // Fromage (type mozza)
  
  // Tentation Chocolat-Passion (des-1)
  { id: 'ri-35', recipeId: 'des-1', ingredientId: 'ing-11', quantity: 80, unitUse: 'g' }, // Chocolat
  { id: 'ri-36', recipeId: 'des-1', ingredientId: 'ing-13', quantity: 1, unitUse: 'pièce' }, // Oeuf
  { id: 'ri-37', recipeId: 'des-1', ingredientId: 'ing-15', quantity: 50, unitUse: 'g' }, // Sucre
];
