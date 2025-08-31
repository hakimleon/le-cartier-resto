

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
};

// This will represent both a "Plat" and a "Préparation"
export type Recipe = {
  id?: string;
  name: string;
  description: string;
  type: 'Plat' | 'Préparation';
  
  // Common fields
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  duration?: number; // in minutes
  tags?: string[];
  imageUrl?: string;
  
  // Fields for Fiche Technique (both Plat and Préparation)
  portions?: number; // For a Plat
  productionQuantity?: number; // For a Préparation
  productionUnit?: string; // For a Préparation (e.g., kg, litre)

  procedure_preparation?: string;
  procedure_cuisson?: string;
  procedure_service?: string;
  allergens?: string[];
  commercialArgument?: string; // Primarily for Plat

  // Fields specific to "Plat"
  price?: number; // Prix de vente
  category?: | 'Entrées froides et chaudes'
  | 'Plats et Grillades'
  | 'Les mets de chez nous'
  | 'Symphonie de pâtes'
  | 'Nos Burgers Bistronomiques'
  | 'Dessert'
  | 'Élixirs & Rafraîchissements';
  status?: 'Actif' | 'Inactif';
  tvaRate?: number; // en pourcentage (ex: 10 pour 10%)
};

export type Ingredient = {
    id?: string;
    name: string;
    category: string;
    stockQuantity: number;
    unitPurchase: string;
    lowStockThreshold: number;
    unitPrice: number;
    supplier: string;
};

// Lien entre une recette et un ingrédient brut
export type RecipeIngredientLink = {
    recipeId: string;
    ingredientId: string;
    quantity: number;
    unitUse: string;
};

// Lien entre une recette (Plat) et une sous-recette (Préparation)
export type RecipePreparationLink = {
    id?: string;
    parentRecipeId: string; // The "Plat"
    childRecipeId: string; // The "Préparation"
    quantity: number;
    unitUse: string;
};