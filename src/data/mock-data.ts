// src/data/mock-data.ts

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


export const suppliers = {
    METRO: "Metro Cash & Carry",
    FRUITS_LEGUMES_ALGER: "Fruits & Légumes d'Alger Centre",
    BOUCHERIE_MODERNE: "Boucherie Moderne El Biar",
    POISSONNERIE_LA_SIRENE: "Poissonnerie La Sirène",
    EPICES_DU_MONDE: "Épices du Monde Bab Ezzouar",
};

export const ingredients: Ingredient[] = [
    { id: 'ing-1', name: "Tomate Grappe", category: "Légumes", unitPurchase: "kg", unitPrice: 350, stockQuantity: 20, supplier: suppliers.FRUITS_LEGUMES_ALGER, lowStockThreshold: 5 },
    { id: 'ing-2', name: "Mozzarella di Bufala", category: "Fromages", unitPurchase: "kg", unitPrice: 2200, stockQuantity: 5, supplier: suppliers.METRO, lowStockThreshold: 2 },
    { id: 'ing-3', name: "Basilic Frais", category: "Herbes aromatiques", unitPurchase: "botte", unitPrice: 100, stockQuantity: 10, supplier: suppliers.FRUITS_LEGUMES_ALGER, lowStockThreshold: 3 },
    { id: 'ing-4', name: "Filet de Boeuf", category: "Viandes et volailles", unitPurchase: "kg", unitPrice: 4500, stockQuantity: 10, supplier: suppliers.BOUCHERIE_MODERNE, lowStockThreshold: 3 },
    { id: 'ing-5', name: "Parmesan Reggiano", category: "Fromages", unitPurchase: "kg", unitPrice: 3000, stockQuantity: 8, supplier: suppliers.METRO, lowStockThreshold: 1 },
    { id: 'ing-6', name: "Roquette", category: "Légumes", unitPurchase: "kg", unitPrice: 800, stockQuantity: 3, supplier: suppliers.FRUITS_LEGUMES_ALGER, lowStockThreshold: 1 },
    { id: 'ing-7', name: "Filet de Saumon", category: "Poissons et fruits de mer", unitPurchase: "kg", unitPrice: 3800, stockQuantity: 7, supplier: suppliers.POISSONNERIE_LA_SIRENE, lowStockThreshold: 2 },
    { id: 'ing-8', name: "Crevettes Roses", category: "Poissons et fruits de mer", unitPurchase: "kg", unitPrice: 2500, stockQuantity: 4, supplier: suppliers.POISSONNERIE_LA_SIRENE, lowStockThreshold: 1 },
    { id: 'ing-9', name: "Pâtes Penne", category: "Céréales", unitPurchase: "kg", unitPrice: 400, stockQuantity: 50, supplier: suppliers.METRO, lowStockThreshold: 10 },
    { id: 'ing-10', name: "Piment Rouge", category: "Épices", unitPurchase: "kg", unitPrice: 1200, stockQuantity: 2, supplier: suppliers.EPICES_DU_MONDE, lowStockThreshold: 0.5 },
    { id: 'ing-11', name: "Chocolat Noir 70%", category: "Desserts", unitPurchase: "kg", unitPrice: 2500, stockQuantity: 6, supplier: suppliers.METRO, lowStockThreshold: 2 },
    { id: 'ing-12', name: "Crème liquide 35%", category: "Produits laitiers", unitPurchase: "L", unitPrice: 800, stockQuantity: 10, supplier: suppliers.METRO, lowStockThreshold: 3 },
    { id: 'ing-13', name: "Oeuf de poule", category: "Œufs", unitPurchase: "pièce", unitPrice: 30, stockQuantity: 120, supplier: suppliers.FRUITS_LEGUMES_ALGER, lowStockThreshold: 24 },
    { id: 'ing-14', name: "Farine T55", category: "Céréales", unitPurchase: "kg", unitPrice: 150, stockQuantity: 30, supplier: suppliers.METRO, lowStockThreshold: 5 },
    { id: 'ing-15', name: "Sucre semoule", category: "Desserts", unitPurchase: "kg", unitPrice: 180, stockQuantity: 40, supplier: suppliers.METRO, lowStockThreshold: 10 },
    { id: 'ing-16', name: 'Ail', category: 'Légumes', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-17', name: 'Oignon', category: 'Légumes', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-18', name: 'Huile d\'olive', category: 'Huiles', unitPurchase: 'L', unitPrice: 1200, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-19', name: 'Sel', category: 'Condiments', unitPurchase: 'kg', unitPrice: 100, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-20', name: 'Poivre noir', category: 'Épices', unitPurchase: 'kg', unitPrice: 3000, stockQuantity: 2, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.5 },
    { id: 'ing-21', name: 'Pomme de terre', category: 'Légumes', unitPurchase: 'kg', unitPrice: 120, stockQuantity: 50, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 10 },
    { id: 'ing-22', name: 'Blanc de poulet', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1100, stockQuantity: 15, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 3 },
    { id: 'ing-23', name: 'Carotte', category: 'Légumes', unitPurchase: 'kg', unitPrice: 100, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-24', name: 'Citron', category: 'Fruits', unitPurchase: 'kg', unitPrice: 250, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-25', name: 'Beurre', category: 'Produits laitiers', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-26', name: 'Lait entier', category: 'Produits laitiers', unitPurchase: 'L', unitPrice: 150, stockQuantity: 12, supplier: 'Metro Cash & Carry', lowStockThreshold: 4 },
    { id: 'ing-27', name: 'Riz basmati', category: 'Céréales', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 25, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-28', name: 'Cumin', category: 'Épices', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-29', name: 'Paprika', category: 'Épices', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-30', name: 'Coriandre fraîche', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 100, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-31', name: 'Persil plat', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 100, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-32', name: 'Viande hachée de boeuf', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 8, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-33', name: 'Merguez', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1600, stockQuantity: 5, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-34', name: 'Poivron rouge', category: 'Légumes', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 6, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-35', name: 'Poivron vert', category: 'Légumes', unitPurchase: 'kg', unitPrice: 350, stockQuantity: 6, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-36', name: 'Concentré de tomate', category: 'Condiments', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-37', name: 'Lentilles corail', category: 'Céréales', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-38', name: 'Gingembre frais', category: 'Épices', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 1, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.2 },
    { id: 'ing-39', name: 'Curcuma', category: 'Épices', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-40', name: 'Crème de coco', category: 'Produits laitiers', unitPurchase: 'L', unitPrice: 900, stockQuantity: 6, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-41', name: 'Gambas', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 3, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-42', name: 'Moules', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 5, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 2 },
    { id: 'ing-43', name: 'Calamars', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 4, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-44', name: 'Filet de daurade', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 4, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-45', name: 'Chapelure', category: 'Céréales', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-46', name: 'Fromage de chèvre', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-47', name: 'Miel', category: 'Desserts', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-48', name: 'Noix', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 2, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.5 },
    { id: 'ing-49', name: 'Amandes effilées', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-50', name: 'Vinaigre balsamique', category: 'Condiments', unitPurchase: 'L', unitPrice: 1500, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-51', name: 'Moutarde de Dijon', category: 'Condiments', unitPurchase: 'kg', unitPrice: 700, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-52', name: 'Concombre', category: 'Légumes', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-53', name: 'Salade laitue', category: 'Légumes', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-54', name: 'Avocat', category: 'Fruits', unitPurchase: 'kg', unitPrice: 1400, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-55', name: 'Champignons de Paris', category: 'Légumes', unitPurchase: 'kg', unitPrice: 1000, stockQuantity: 3, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-56', name: 'Pâtes spaghetti', category: 'Céréales', unitPurchase: 'kg', unitPrice: 350, stockQuantity: 30, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-57', name: 'Pâtes tagliatelles', category: 'Céréales', unitPurchase: 'kg', unitPrice: 450, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-58', name: 'Gruyère râpé', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2400, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-59', name: 'Cheddar en tranches', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-60', name: 'Pain burger brioché', category: 'Boulangerie', unitPurchase: 'pièce', unitPrice: 80, stockQuantity: 40, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 10 },
    { id: 'ing-61', name: 'Sauce barbecue', category: 'Condiments', unitPurchase: 'L', unitPrice: 800, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-62', name: 'Fraise', category: 'Fruits', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-63', name: 'Framboise', category: 'Fruits', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 2, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.5 },
    { id: 'ing-64', name: 'Myrtille', category: 'Fruits', unitPurchase: 'kg', unitPrice: 3000, stockQuantity: 2, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.5 },
    { id: 'ing-65', name: 'Mascarpone', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-66', name: 'Biscuits à la cuillère', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 1000, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-67', name: 'Café en grains', category: 'Boissons', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-68', name: 'Cacao en poudre', category: 'Desserts', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-69', name: 'Gousse de vanille', category: 'Épices', unitPurchase: 'pièce', unitPrice: 150, stockQuantity: 20, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 5 },
    { id: 'ing-70', name: 'Sucre glace', category: 'Desserts', unitPurchase: 'kg', unitPrice: 300, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-71', name: "Feuille de gélatine", category: 'Desserts', unitPurchase: 'pièce', unitPrice: 20, stockQuantity: 100, supplier: 'Metro Cash & Carry', lowStockThreshold: 20 },
    { id: 'ing-72', name: 'Entrecôte de boeuf', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 3200, stockQuantity: 12, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 3 },
    { id: 'ing-73', name: 'Côte d\'agneau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 8, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-74', name: 'Saucisse de veau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1900, stockQuantity: 6, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-75', name: 'Thon à l\'huile', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 3 },
    { id: 'ing-76', name: 'Anchois', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-77', name: 'Olives noires', category: 'Condiments', unitPurchase: 'kg', unitPrice: 900, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-78', name: 'Olives vertes', category: 'Condiments', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-79', name: 'Câpres', category: 'Condiments', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-80', name: 'Cornichons', category: 'Condiments', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-81', name: 'Harissa', category: 'Condiments', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 3, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 1 },
    { id: 'ing-82', name: 'Pois chiches', category: 'Céréales', unitPurchase: 'kg', unitPrice: 450, stockQuantity: 15, supplier: 'Metro Cash & Carry', lowStockThreshold: 3 },
    { id: 'ing-83', name: 'Menthe fraîche', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 120, stockQuantity: 15, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 5 },
    { id: 'ing-84', name: 'Aubergine', category: 'Légumes', unitPurchase: 'kg', unitPrice: 200, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-85', name: 'Courgette', category: 'Légumes', unitPurchase: 'kg', unitPrice: 180, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-86', name: 'Navet', category: 'Légumes', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-87', name: 'Feuilles de brick', category: 'Boulangerie', unitPurchase: 'paquet', unitPrice: 250, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-88', name: 'Pistaches', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 5000, stockQuantity: 2, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.5 },
    { id: 'ing-89', name: 'Eau de fleur d\'oranger', category: 'Desserts', unitPurchase: 'L', unitPrice: 800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-90', name: 'Semoule fine', category: 'Céréales', unitPurchase: 'kg', unitPrice: 200, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-91', name: 'Levure chimique', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 1, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.2 },
    { id: 'ing-92', name: 'Levure de boulanger', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 1, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.2 },
    { id: 'ing-93', name: 'Chorizo', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2200, stockQuantity: 4, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 1 },
    { id: 'ing-94', name: 'Camembert', category: 'Fromages', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-95', name: 'Roquefort', category: 'Fromages', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-96', name: 'Pain de mie', category: 'Boulangerie', unitPurchase: 'paquet', unitPrice: 300, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 3 },
    { id: 'ing-97', name: 'Ketchup', category: 'Condiments', unitPurchase: 'L', unitPrice: 500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-98', name: 'Mayonnaise', category: 'Condiments', unitPurchase: 'L', unitPrice: 600, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-99', name: 'Ananas', category: 'Fruits', unitPurchase: 'pièce', unitPrice: 700, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-100', name: 'Mangue', category: 'Fruits', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 3, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-101', name: 'Fruit de la passion', category: 'Fruits', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 2, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.5 },
    { id: 'ing-102', name: 'Kiwi', category: 'Fruits', unitPurchase: 'kg', unitPrice: 900, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-103', name: 'Gingembre en poudre', category: 'Épices', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-104', name: 'Cannelle en poudre', category: 'Épices', unitPurchase: 'kg', unitPrice: 2200, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-105', name: 'Noix de muscade', category: 'Épices', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 0.5, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.1 },
    { id: 'ing-106', name: 'Clou de girofle', category: 'Épices', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 0.5, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.1 },
    { id: 'ing-107', name: 'Cardamome', category: 'Épices', unitPurchase: 'kg', unitPrice: 8000, stockQuantity: 0.2, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.05 },
    { id: 'ing-108', name: 'Safran', category: 'Épices', unitPurchase: 'kg', unitPrice: 500000, stockQuantity: 0.01, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.002 },
    { id: 'ing-109', name: 'Haricots verts', category: 'Légumes', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-110', name: 'Petits pois', category: 'Légumes', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 6, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-111', name: 'Artichaut', category: 'Légumes', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-112', name: 'Asperge', category: 'Légumes', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-113', name: 'Brocoli', category: 'Légumes', unitPurchase: 'kg', unitPrice: 450, stockQuantity: 6, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-114', name: 'Chou-fleur', category: 'Légumes', unitPurchase: 'kg', unitPrice: 300, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-115', name: 'Épinards', category: 'Légumes', unitPurchase: 'kg', unitPrice: 250, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-116', name: 'Fenouil', category: 'Légumes', unitPurchase: 'kg', unitPrice: 200, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-117', name: 'Poireau', category: 'Légumes', unitPurchase: 'kg', unitPrice: 220, stockQuantity: 7, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-118', name: 'Céleri branche', category: 'Légumes', unitPurchase: 'kg', unitPrice: 180, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-119', name: 'Betterave', category: 'Légumes', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-120', name: 'Radis', category: 'Légumes', unitPurchase: 'botte', unitPrice: 100, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-121', name: 'Figue', category: 'Fruits', unitPurchase: 'kg', unitPrice: 900, stockQuantity: 3, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-122', name: 'Datte', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-123', name: 'Abricot sec', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-124', name: 'Pruneau', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-125', name: 'Raisin sec', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-126', name: 'Gigot d\'agneau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2900, stockQuantity: 10, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-127', name: 'Épaule d\'agneau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2700, stockQuantity: 8, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-128', name: 'Carré d\'agneau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 5, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 1 },
    { id: 'ing-129', name: 'Veau (escalope)', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 10, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-130', name: 'Jarret de veau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 2400, stockQuantity: 6, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 2 },
    { id: 'ing-131', name: 'Foie de veau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 4, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 1 },
    { id: 'ing-132', name: 'Langue de veau', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 3, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 1 },
    { id: 'ing-133', name: 'Cuisse de poulet', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 900, stockQuantity: 20, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 5 },
    { id: 'ing-134', name: 'Ailes de poulet', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 700, stockQuantity: 15, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 4 },
    { id: 'ing-135', name: 'Poulet entier', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 10, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 3 },
    { id: 'ing-136', name: 'Magret de canard', category: 'Viandes et volailles', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 5, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 1 },
    { id: 'ing-137', name: 'Lotte', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 3200, stockQuantity: 4, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-138', name: 'Bar', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 2900, stockQuantity: 5, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 2 },
    { id: 'ing-139', name: 'Turbot', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 4500, stockQuantity: 3, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-140', name: 'Saint-Pierre', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 3, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-141', name: 'Rouget', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 6, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 2 },
    { id: 'ing-142', name: 'Sardine', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 10, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 3 },
    { id: 'ing-143', name: 'Maquereau', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 8, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 2 },
    { id: 'ing-144', name: 'Langouste', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 9000, stockQuantity: 2, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 0.5 },
    { id: 'ing-145', name: 'Homard', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 12000, stockQuantity: 2, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 0.5 },
    { id: 'ing-146', name: 'Saint-Jacques', category: 'Poissons et fruits de mer', unitPurchase: 'kg', unitPrice: 6000, stockQuantity: 3, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 1 },
    { id: 'ing-147', name: 'Huître', category: 'Poissons et fruits de mer', unitPurchase: 'douzaine', unitPrice: 2500, stockQuantity: 10, supplier: 'Poissonnerie La Sirène', lowStockThreshold: 3 },
    { id: 'ing-148', name: 'Yaourt nature', category: 'Produits laitiers', unitPurchase: 'L', unitPrice: 200, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 3 },
    { id: 'ing-149', name: 'Fromage blanc', category: 'Fromages', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-150', name: 'Emmental', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2200, stockQuantity: 6, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-151', name: 'Comté', category: 'Fromages', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-152', name: 'Brie', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-153', name: 'Gorgonzola', category: 'Fromages', unitPurchase: 'kg', unitPrice: 3800, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-154', name: 'Feta', category: 'Fromages', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-155', name: 'Ricotta', category: 'Fromages', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-156', name: 'Polenta', category: 'Céréales', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-157', name: 'Boulgour', category: 'Céréales', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 8, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-158', name: 'Quinoa', category: 'Céréales', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 7, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-159', name: 'Pain de campagne', category: 'Boulangerie', unitPurchase: 'pièce', unitPrice: 300, stockQuantity: 15, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 4 },
    { id: 'ing-160', name: 'Baguette', category: 'Boulangerie', unitPurchase: 'pièce', unitPrice: 150, stockQuantity: 30, supplier: 'Boucherie Moderne El Biar', lowStockThreshold: 10 },
    { id: 'ing-161', name: 'Pâte feuilletée', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 1000, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-162', name: 'Pâte brisée', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-163', name: 'Pâte sablée', category: 'Boulangerie', unitPurchase: 'kg', unitPrice: 900, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-164', name: 'Chocolat blanc', category: 'Desserts', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-165', name: 'Chocolat au lait', category: 'Desserts', unitPurchase: 'kg', unitPrice: 2600, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-166', name: 'Praliné', category: 'Desserts', unitPurchase: 'kg', unitPrice: 4500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-167', name: 'Purée de fruits (fraise)', category: 'Desserts', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-168', name: 'Purée de fruits (framboise)', category: 'Desserts', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-169', name: 'Purée de fruits (mangue)', category: 'Desserts', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-170', name: 'Sirop d\'érable', category: 'Desserts', unitPurchase: 'L', unitPrice: 2500, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-171', name: 'Huile de tournesol', category: 'Huiles', unitPurchase: 'L', unitPrice: 400, stockQuantity: 20, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-172', name: 'Huile d\'arachide', category: 'Huiles', unitPurchase: 'L', unitPrice: 500, stockQuantity: 15, supplier: 'Metro Cash & Carry', lowStockThreshold: 4 },
    { id: 'ing-173', name: 'Huile de sésame', category: 'Huiles', unitPurchase: 'L', unitPrice: 2000, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-174', name: 'Vinaigre de vin rouge', category: 'Condiments', unitPurchase: 'L', unitPrice: 600, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-175', name: 'Vinaigre de vin blanc', category: 'Condiments', unitPurchase: 'L', unitPrice: 550, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-176', name: 'Vinaigre de cidre', category: 'Condiments', unitPurchase: 'L', unitPrice: 700, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-177', name: 'Sauce soja', category: 'Condiments', unitPurchase: 'L', unitPrice: 800, stockQuantity: 6, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-178', name: 'Sauce Worcestershire', category: 'Condiments', unitPurchase: 'L', unitPrice: 1200, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-179', name: 'Tabasco', category: 'Condiments', unitPurchase: 'L', unitPrice: 1500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-180', name: 'Aneth', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 150, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-181', name: 'Ciboulette', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 130, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 4 },
    { id: 'ing-182', name: 'Estragon', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 180, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-183', name: 'Romarin', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 100, stockQuantity: 12, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 4 },
    { id: 'ing-184', name: 'Thym', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 100, stockQuantity: 15, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 5 },
    { id: 'ing-185', name: 'Laurier', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 80, stockQuantity: 20, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 6 },
    { id: 'ing-186', name: 'Sauge', category: 'Herbes aromatiques', unitPurchase: 'botte', unitPrice: 160, stockQuantity: 6, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-187', name: 'Poivre de Cayenne', category: 'Épices', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-188', name: 'Piment d\'Espelette', category: 'Épices', unitPurchase: 'kg', unitPrice: 5000, stockQuantity: 0.5, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.1 },
    { id: 'ing-189', name: 'Herbes de Provence', category: 'Épices', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 2, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.5 },
    { id: 'ing-190', name: 'Ras el hanout', category: 'Épices', unitPurchase: 'kg', unitPrice: 3000, stockQuantity: 1, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.2 },
    { id: 'ing-191', name: 'Graines de sésame', category: 'Épices', unitPurchase: 'kg', unitPrice: 1800, stockQuantity: 3, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 1 },
    { id: 'ing-192', name: 'Graines de pavot', category: 'Épices', unitPurchase: 'kg', unitPrice: 2000, stockQuantity: 2, supplier: 'Épices du Monde Bab Ezzouar', lowStockThreshold: 0.5 },
    { id: 'ing-193', name: 'Graines de tournesol', category: 'Épices', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 4, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-194', name: 'Graines de lin', category: 'Épices', unitPurchase: 'kg', unitPrice: 1300, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-195', name: 'Noisettes', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 4500, stockQuantity: 2, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.5 },
    { id: 'ing-196', name: 'Noix de cajou', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 4200, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-197', name: 'Noix de pécan', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 5500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-198', name: 'Noix du Brésil', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 5000, stockQuantity: 1, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.2 },
    { id: 'ing-199', name: 'Pignons de pin', category: 'Fruits secs', unitPurchase: 'kg', unitPrice: 12000, stockQuantity: 0.5, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.1 },
    { id: 'ing-200', name: 'Orange', category: 'Fruits', unitPurchase: 'kg', unitPrice: 200, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-201', name: 'Pamplemousse', category: 'Fruits', unitPurchase: 'kg', unitPrice: 300, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-202', name: 'Mandarine', category: 'Fruits', unitPurchase: 'kg', unitPrice: 250, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-203', name: 'Pomme', category: 'Fruits', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 15, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 4 },
    { id: 'ing-204', name: 'Poire', category: 'Fruits', unitPurchase: 'kg', unitPrice: 450, stockQuantity: 12, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-205', name: 'Banane', category: 'Fruits', unitPurchase: 'kg', unitPrice: 350, stockQuantity: 20, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 5 },
    { id: 'ing-206', name: 'Raisin', category: 'Fruits', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-207', name: 'Pêche', category: 'Fruits', unitPurchase: 'kg', unitPrice: 500, stockQuantity: 7, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-208', name: 'Abricot', category: 'Fruits', unitPurchase: 'kg', unitPrice: 450, stockQuantity: 6, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-209', name: 'Prune', category: 'Fruits', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 7, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-210', name: 'Cerise', category: 'Fruits', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-211', name: 'Melon', category: 'Fruits', unitPurchase: 'kg', unitPrice: 150, stockQuantity: 10, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 3 },
    { id: 'ing-212', name: 'Pastèque', category: 'Fruits', unitPurchase: 'kg', unitPrice: 100, stockQuantity: 8, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-213', name: 'Jus d\'orange', category: 'Boissons', unitPurchase: 'L', unitPrice: 300, stockQuantity: 15, supplier: 'Metro Cash & Carry', lowStockThreshold: 5 },
    { id: 'ing-214', name: 'Jus de pomme', category: 'Boissons', unitPurchase: 'L', unitPrice: 280, stockQuantity: 12, supplier: 'Metro Cash & Carry', lowStockThreshold: 4 },
    { id: 'ing-215', name: 'Jus d\'ananas', category: 'Boissons', unitPurchase: 'L', unitPrice: 400, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 3 },
    { id: 'ing-216', name: 'Coca-Cola', category: 'Boissons', unitPurchase: 'L', unitPrice: 180, stockQuantity: 50, supplier: 'Metro Cash & Carry', lowStockThreshold: 12 },
    { id: 'ing-217', name: 'Orangina', category: 'Boissons', unitPurchase: 'L', unitPrice: 200, stockQuantity: 40, supplier: 'Metro Cash & Carry', lowStockThreshold: 10 },
    { id: 'ing-218', name: 'Eau minérale plate', category: 'Boissons', unitPurchase: 'L', unitPrice: 50, stockQuantity: 100, supplier: 'Metro Cash & Carry', lowStockThreshold: 24 },
    { id: 'ing-219', name: 'Eau minérale gazeuse', category: 'Boissons', unitPurchase: 'L', unitPrice: 80, stockQuantity: 80, supplier: 'Metro Cash & Carry', lowStockThreshold: 24 },
    { id: 'ing-220', name: 'Bière locale', category: 'Boissons', unitPurchase: 'bouteille', unitPrice: 250, stockQuantity: 120, supplier: 'Metro Cash & Carry', lowStockThreshold: 24 },
    { id: 'ing-221', name: 'Vin rouge (local)', category: 'Boissons', unitPurchase: 'bouteille', unitPrice: 1500, stockQuantity: 30, supplier: 'Metro Cash & Carry', lowStockThreshold: 6 },
    { id: 'ing-222', name: 'Vin blanc (local)', category: 'Boissons', unitPurchase: 'bouteille', unitPrice: 1400, stockQuantity: 30, supplier: 'Metro Cash & Carry', lowStockThreshold: 6 },
    { id: 'ing-223', name: 'Vin rosé (local)', category: 'Boissons', unitPurchase: 'bouteille', unitPrice: 1300, stockQuantity: 25, supplier: 'Metro Cash & Carry', lowStockThreshold: 6 },
    { id: 'ing-224', name: 'Thé vert', category: 'Boissons', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-225', name: 'Thé noir', category: 'Boissons', unitPurchase: 'kg', unitPrice: 700, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-226', name: 'Infusion (verveine)', category: 'Boissons', unitPurchase: 'kg', unitPrice: 1000, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-227', name: 'Infusion (camomille)', category: 'Boissons', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-228', name: 'Fécule de maïs (Maïzena)', category: 'Céréales', unitPurchase: 'kg', unitPrice: 400, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-229', name: 'Vinaigre de riz', category: 'Condiments', unitPurchase: 'L', unitPrice: 900, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-230', name: 'Wasabi', category: 'Condiments', unitPurchase: 'kg', unitPrice: 4000, stockQuantity: 1, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.2 },
    { id: 'ing-231', name: 'Gari (gingembre mariné)', category: 'Condiments', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-232', name: 'Algues Nori', category: 'Condiments', unitPurchase: 'paquet', unitPrice: 150, stockQuantity: 30, supplier: 'Metro Cash & Carry', lowStockThreshold: 10 },
    { id: 'ing-233', name: 'Riz à sushi', category: 'Céréales', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 15, supplier: 'Metro Cash & Carry', lowStockThreshold: 3 },
    { id: 'ing-234', name: 'Tofu', category: 'Légumes', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-235', name: 'Champignons shiitake', category: 'Légumes', unitPurchase: 'kg', unitPrice: 3000, stockQuantity: 2, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 0.5 },
    { id: 'ing-236', name: 'Champignons pleurotes', category: 'Légumes', unitPurchase: 'kg', unitPrice: 2500, stockQuantity: 3, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-237', name: 'Champignons de Paris bruns', category: 'Légumes', unitPurchase: 'kg', unitPrice: 1200, stockQuantity: 4, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 1 },
    { id: 'ing-238', name: 'Endive', category: 'Légumes', unitPurchase: 'kg', unitPrice: 600, stockQuantity: 5, supplier: 'Fruits & Légumes d\'Alger Centre', lowStockThreshold: 2 },
    { id: 'ing-239', name: 'Lait de soja', category: 'Boissons', unitPurchase: 'L', unitPrice: 400, stockQuantity: 8, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-240', name: 'Lait d\'amande', category: 'Boissons', unitPurchase: 'L', unitPrice: 600, stockQuantity: 6, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-241', name: 'Huile de colza', category: 'Huiles', unitPurchase: 'L', unitPrice: 350, stockQuantity: 15, supplier: 'Metro Cash & Carry', lowStockThreshold: 4 },
    { id: 'ing-242', name: 'Huile de noix', category: 'Huiles', unitPurchase: 'L', unitPrice: 2500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-243', name: 'Vinaigre de Xérès', category: 'Condiments', unitPurchase: 'L', unitPrice: 1800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-244', name: 'Sirop de glucose', category: 'Desserts', unitPurchase: 'kg', unitPrice: 700, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-245', name: 'Pectine', category: 'Desserts', unitPurchase: 'kg', unitPrice: 3000, stockQuantity: 1, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.2 },
    { id: 'ing-246', name: 'Agar-agar', category: 'Desserts', unitPurchase: 'kg', unitPrice: 8000, stockQuantity: 0.5, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.1 },
    { id: 'ing-247', name: 'Farine de sarrasin', category: 'Céréales', unitPurchase: 'kg', unitPrice: 800, stockQuantity: 5, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-248', name: 'Farine de maïs', category: 'Céréales', unitPurchase: 'kg', unitPrice: 300, stockQuantity: 10, supplier: 'Metro Cash & Carry', lowStockThreshold: 2 },
    { id: 'ing-249', name: 'Farine de châtaigne', category: 'Céréales', unitPurchase: 'kg', unitPrice: 1500, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-250', name: 'Reblochon', category: 'Fromages', unitPurchase: 'kg', unitPrice: 2800, stockQuantity: 3, supplier: 'Metro Cash & Carry', lowStockThreshold: 1 },
    { id: 'ing-251', name: 'Morbier', category: 'Fromages', unitPurchase: 'kg', unitPrice: 3200, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-252', name: 'Abondance', category: 'Fromages', unitPurchase: 'kg', unitPrice: 3500, stockQuantity: 2, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.5 },
    { id: 'ing-253', name: 'Beaufort', category: 'Fromages', unitPurchase: 'kg', unitPrice: 4500, stockQuantity: 1, supplier: 'Metro Cash & Carry', lowStockThreshold: 0.2 }
];


export const recipes: Recipe[] = [
    // Entrées Froides – Fraîcheur et Élégance
    {
      id: 'ef-1',
      name: "Oeuf cremeux a la mayo maison  'Ouefs Mimosa'",
      description: "oeuf dur nappe avec une mayonnaise onctueuse montee a la main, aux couleurs locales",
      price: 900,
      cost: 360,
      category: 'Entrées Froides – Fraîcheur et Élégance',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'creamy egg',
      prepTime: 10,
      status: 'Actif',
      difficulty: 2,
      tags: [],
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
    }
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