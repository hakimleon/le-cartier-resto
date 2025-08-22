
// src/data/mock-data.ts

// ============================================================================
// NEW DATA STRUCTURE
// ============================================================================

export type Recipe = {
  id: string;
  name: string;
  description: string;
  category: 'Entrées Froides – Fraîcheur et Élégance' | 'Entrées Chaudes – Gourmandise et Chaleur' | 'Plats et Grillades – Saveurs en Majesté' | 'Les Mets de chez Nous' | 'Symphonie de Pâtes – Évasion Italienne' | 'Nos Burgers Bistronomiques' | 'Douceurs Signature – Éclats Sucrés de l’Instant' | 'Élixirs & Rafraîchissements';
  price: number;
  cost: number; // This will be calculated from RecipeIngredients
  image: string;
  imageHint: string;
  prepTime: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: 'Actif' | 'Inactif' | 'Saisonnier';
  tags: string[];
  portionSize?: string;
  calories?: number;
  procedure: {
    preparation: string[];
    cuisson: string[];
    service: string[];
  };
  allergens: string[];
  notes?: string | null;
  argumentationCommerciale?: string;
};

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  unitPurchase: string;
  unitPrice: number;
  stockQuantity: number;
  supplier: string;
  lowStockThreshold: number;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unitUse: string;
};


export const categories: ('Entrées Froides – Fraîcheur et Élégance' | 'Entrées Chaudes – Gourmandise et Chaleur' | 'Plats et Grillades – Saveurs en Majesté' | 'Les Mets de chez Nous' | 'Symphonie de Pâtes – Évasion Italienne' | 'Nos Burgers Bistronomiques' | 'Douceurs Signature – Éclats Sucrés de l’Instant' | 'Élixirs & Rafraîchissements')[] = ['Entrées Froides – Fraîcheur et Élégance', 'Entrées Chaudes – Gourmandise et Chaleur', 'Plats et Grillades – Saveurs en Majesté', 'Les Mets de chez Nous', 'Symphonie de Pâtes – Évasion Italienne', 'Nos Burgers Bistronomiques', 'Douceurs Signature – Éclats Sucrés de l’Instant', 'Élixirs & Rafraîchissements'];
export const tags: ('Végétarien' | 'Épicé' | 'Sans gluten' | 'Spécialité locale' | 'Halal' | 'Nouveau' | 'Populaire')[] = ['Végétarien', 'Épicé', 'Sans gluten', 'Spécialité locale', 'Halal', 'Nouveau', 'Populaire'];


// ============================================================================
// DATA MIGRATION
// ============================================================================

export const ingredients: Ingredient[] = [
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
    { id: 'ing-16', name: 'Ail', category: 'Légumes', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 5, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-17', name: 'Oignon', category: 'Légumes', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 10, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 2 },
    { id: 'ing-18', name: 'Huile d\'olive', category: 'Huiles', unitPurchase: 'L', unitPrice: 1200, stockQuantity: 10, supplier: "Metro Cash & Carry", lowStockThreshold: 2 },
    { id: 'ing-19', name: 'Sel', category: 'Condiments', unitPurchase: 'kg', unitPrice: 100, stockQuantity: 20, supplier: "Metro Cash & Carry", lowStockThreshold: 5 },
    { id: 'ing-20', name: 'Poivre noir', category: 'Épices', unitPurchase: 'kg', unitPrice: 3000, stockQuantity: 2, supplier: "Épices du Monde Bab Ezzouar", lowStockThreshold: 0.5 },
    { id: 'ing-21', name: 'Pomme de terre', category: 'Légumes', unitPurchase: 'kg', unitPrice: 120, stockQuantity: 50, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 10 },
    { id: 'ing-22', name: 'Blanc de poulet', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1100, stockQuantity: 15, supplier: "Boucherie Moderne El Biar", lowStockThreshold: 3 },
    { id: 'ing-23', name: 'Carotte', category: 'Légumes', unitPurchase: 'kg', unitPrice: 100, stockQuantity: 10, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 2 },
    { id: 'ing-24', name: 'Citron', category: 'Fruits', unitPurchase: 'kg', unitPrice: 250, stockQuantity: 5, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-25', name: 'Beurre', category: 'Produits laitiers', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: "Metro Cash & Carry", lowStockThreshold: 1 },
    { id: 'ing-51', name: 'Moutarde de Dijon', category: 'Condiments', unitPurchase: 'kg', unitPrice: 700, stockQuantity: 2, supplier: "Metro Cash & Carry", lowStockThreshold: 0.5 },
    { id: 'ing-53', name: 'Salade laitue', category: 'Légumes', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 5, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 2 },
    { id: 'ing-54', name: 'Avocat', category: 'Fruits', unitPurchase: 'kg', unitPrice: 1400, stockQuantity: 4, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-55', name: 'Champignons de Paris', category: 'Légumes', unitPurchase: 'kg', unitPrice: 1000, stockQuantity: 3, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-45', name: 'Chapelure', category: 'Céréales', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-94', name: 'Camembert', category: 'Fromages', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-48', name: 'Noix', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 2, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 0.5 },
    { id: 'ing-47', name: 'Miel', category: 'Desserts', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-150', name: 'Emmental', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2200, stockQuantity: 6, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-93', name: 'Chorizo', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2200, stockQuantity: 4, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 1 },
    { id: 'ing-34', name: 'Poivron rouge', category: 'Légumes', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 6, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 2 },
    { id: 'ing-33', name: 'Merguez', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1600, stockQuantity: 5, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-96', name: 'Pain de campagne', category: 'Boulangerie', unitPurchase: 'pièce', unitPrice: 300, stockQuantity: 15, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 4 },
    { id: 'ing-121', name: 'Figue', category: 'Fruits', unitPurchase: 'kg', unitPrice: 900, stockQuantity: 3, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-52', name: 'Concombre', category: 'Légumes', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 8, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 2 },
    { id: 'ing-35', name: 'Poivron vert', category: 'Légumes', unitPurchase: 'kg', unitPrice: 350, stockQuantity: 6, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 2 },
    { id: 'ing-43', name: 'Calamars', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 4, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-133', name: 'Cuisse de poulet', category: 'Viandes et volailles', unitPrice: 'kg', unitPrice: 900, stockQuantity: 20, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 5 },
    { id: 'ing-127', name: "Épaule d'agneau", category: 'Viandes et volailles', unitPrice: 'kg', unitPrice: 2700, stockQuantity: 8, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-32', name: 'Viande hachée de boeuf', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 8, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-30', name: 'Coriandre fraîche', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 100, stockQuantity: 10, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 3 },
    { id: 'ing-78', name: 'Olives vertes', category: 'Condiments', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-56', name: 'Pâtes spaghetti', category: 'Céréales', unitPurchase: 'kg', unitPrice: 350, stockQuantity: 30, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-57', name: 'Pâtes tagliatelles', category: 'Céréales', unitPurchase: 'kg', unitPrice: 450, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-27', name: 'Riz arborio', category: 'Céréales', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 25, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-42', name: 'Moules', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 5, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 2 },
    { id: 'ing-60', name: 'Pain burger brioché', category: 'Boulangerie', unitPurchase: 'pièce', unitPrice: 80, stockQuantity: 40, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 10 },
    { id: 'ing-236', name: 'Champignons pleurotes', category: 'Légumes', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 3, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-151', name: 'Comté', category: 'Fromages', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-72', name: 'Entrecôte de boeuf', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 3200, stockQuantity: 12, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 3 },
    { id: 'ing-62', name: 'Fraise', category: 'Fruits', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 4, supplier: "Fruits & Légumes d'Alger Centre", lowStockThreshold: 1 },
    { id: 'ing-65', name: 'Mascarpone', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-66', name: 'Biscuits à la cuillère', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 1000, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-67', name: 'Café', category: 'Boissons', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-69', name: 'Gousse de vanille', category: 'Épices', unitPurchase: 'pièce', unitPrice: 150, stockQuantity: 20, supplier: "Épices du Monde Bab Ezzouar", lowStockThreshold: 5 },
    { id: 'ing-87', name: 'Feuille de brick', category: 'Boulangerie', unitPurchase: 'paquet', unitPrice: 250, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-49', name: 'Amande', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
];

export const recipes: Recipe[] = [
    {
      id: 'ef-1',
      name: "Oeuf cremeux a la mayo maison  'Ouefs Mimosa'",
      description: "oeuf dur nappe avec une mayonnaise onctueuse montee a la main, aux couleurs locales",
      price: 900, cost: 0,
      category: 'Entrées Froides – Fraîcheur et Élégance',
      image: 'https://placehold.co/600x400.png', imageHint: 'creamy egg',
      prepTime: 10, status: 'Actif', difficulty: 2, tags: [],
      procedure: {
          preparation: ["Préparer une mayonnaise maison en montant l'huile avec le jaune d'oeuf et la moutarde.", "Napper généreusement l'oeuf dur avec la mayonnaise."],
          cuisson: ["Faire cuire l'oeuf pour qu'il soit dur."],
          service: ["Servir frais."]
      },
      allergens: ['Oeuf'],
    },
    {
      id: 'ef-2',
      name: 'Caprice Méditerranéen',
      description: 'Duo de tomate et mozzarella aux herbes fraîches',
      category: 'Entrées Froides – Fraîcheur et Élégance',
      price: 1200, cost: 0,
      image: 'https://placehold.co/600x400.png', imageHint: 'caprese salad',
      prepTime: 10, difficulty: 1, status: 'Actif', tags: ['Végétarien'],
      portionSize: '1 assiette / 200g', calories: 250,
      procedure: {
          preparation: ['Couper les tomates en rondelles régulières.', 'Alterner les tranches de tomate et de mozzarella sur une assiette.', 'Ajouter des feuilles de basilic frais.'],
          cuisson: [],
          service: ['Assaisonner d’un filet d’huile d’olive, sel et poivre.']
      },
      allergens: ['Lactose'],
      notes: 'Privilégier une mozzarella de bufflonne et des tomates bien mûres pour un goût optimal.',
      argumentationCommerciale: "Je vous conseille ce grand classique de la cuisine méditerranéenne : l’alliance des tomates mûres, de la mozzarella fondante et du basilic frais, relevée d’une touche d’huile d’olive. C’est une entrée fraîche, légère et pleine de soleil."
    },
];

export const recipeIngredients: RecipeIngredient[] = [
    { id: 'ri-1', recipeId: 'ef-1', ingredientId: 'ing-13', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-2', recipeId: 'ef-1', ingredientId: 'ing-18', quantity: 0.05, unitUse: 'L' },
    { id: 'ri-3', recipeId: 'ef-1', ingredientId: 'ing-51', quantity: 0.01, unitUse: 'kg' },

    { id: 'ri-4', recipeId: 'ef-2', ingredientId: 'ing-1', quantity: 0.15, unitUse: 'kg' },
    { id: 'ri-5', recipeId: 'ef-2', ingredientId: 'ing-2', quantity: 0.125, unitUse: 'kg' },
    { id: 'ri-6', recipeId: 'ef-2', ingredientId: 'ing-3', quantity: 0.1, unitUse: 'botte' },
];


export type PerformanceData = {
  menuItemId: string;
  totalSales: number;
  averageRating: number;
};

export const menuPerformanceData: PerformanceData[] = [
  { menuItemId: "ef-2", totalSales: 150, averageRating: 4.8 },
  { menuItemId: "ef-3", totalSales: 120, averageRating: 4.5 },
  { menuItemId: "pg-16", totalSales: 200, averageRating: 4.9 },
  { menuItemId: "des-1", totalSales: 180, averageRating: 4.7 },
  { menuItemId: "burg-1", totalSales: 250, averageRating: 4.6 },
  { menuItemId: 'lmdcn-2', totalSales: 90, averageRating: 4.9 },
  { menuItemId: 'ec-2', totalSales: 70, averageRating: 4.2 },
  { menuItemId: 'sp-7', totalSales: 110, averageRating: 4.5 },
  { menuItemId: 'pg-14', totalSales: 130, averageRating: 4.8 },
  { menuItemId: 'ef-9', totalSales: 60, averageRating: 3.9 },
];

export type HistoricalPerformanceData = {
    month: string;
    'pg-16': number;
    'des-1': number;
    'burg-1': number;
    'lmdcn-2': number;
}

export const historicalPerformanceData: HistoricalPerformanceData[] = [
  { month: "Janvier", "pg-16": 186, "des-1": 80, "burg-1": 210, "lmdcn-2": 70 },
  { month: "Février", "pg-16": 305, "des-1": 200, "burg-1": 250, "lmdcn-2": 120 },
  { month: "Mars", "pg-16": 237, "des-1": 120, "burg-1": 300, "lmdcn-2": 150 },
  { month: "Avril", "pg-16": 73, "des-1": 190, "burg-1": 280, "lmdcn-2": 110 },
  { month: "Mai", "pg-16": 209, "des-1": 130, "burg-1": 320, "lmdcn-2": 160 },
  { month: "Juin", "pg-16": 214, "des-1": 140, "burg-1": 350, "lmdcn-2": 180 },
];


export type Table = {
    id: number;
    seats: number;
    status: 'available' | 'occupied' | 'reserved';
    shape: 'round' | 'square';
}

export const tables: Table[] = [
    { id: 1, seats: 2, status: 'available', shape: 'round' },
    { id: 2, seats: 4, status: 'occupied', shape: 'square' },
    { id: 3, seats: 2, status: 'reserved', shape: 'round' },
    { id: 4, seats: 6, status: 'available', shape: 'square' },
    { id: 5, seats: 4, status: 'available', shape: 'round' },
    { id: 6, seats: 8, status: 'occupied', shape: 'square' },
];

export const suppliers = {
    METRO: "Metro Cash & Carry",
    FRUITS_LEGUMES_ALGER: "Fruits & Légumes d'Alger Centre",
    BOUCHERIE_MODERNE: "Boucherie Moderne El Biar",
    POISSONNERIE_LA_SIRENE: "Poissonnerie La Sirène",
    EPICES_DU_MONDE: "Épices du Monde Bab Ezzouar",
};

    