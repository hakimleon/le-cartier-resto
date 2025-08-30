

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
};

export type Recipe = {
  id?: string;
  name: string;
  description: string;
  type: 'Plat' | 'Préparation'; // NOUVEAU: Distingue un plat vendable d'une sous-recette
  
  // Champs spécifiques aux plats (vendables)
  price?: number; // Prix de vente TTC
  category?: | 'Entrées froides et chaudes'
  | 'Plats et Grillades'
  | 'Les mets de chez nous'
  | 'Symphonie de pâtes'
  | 'Nos Burgers Bistronomiques'
  | 'Dessert'
  | 'Élixirs & Rafraîchissements';
  status?: 'Actif' | 'Inactif';

  // Champs communs
  imageUrl?: string;
  tags?: string[];
  duration?: number; // in minutes
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  
  // Fiche Technique Fields
  portions?: number;
  tvaRate?: number; // en pourcentage (ex: 10 pour 10%)
  procedure_preparation?: string;
  procedure_cuisson?: string;
  procedure_service?: string;
  allergens?: string[];
  commercialArgument?: string;
  
  // Pour les préparations, l'unité de production (ex: litre, kg)
  productionUnit?: string; 
  productionQuantity?: number;
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
}

// NOUVEAU: Lien entre une recette et une préparation (sous-recette)
export type RecipePreparationLink = {
    recipeId: string; // Recette parente (ex: Pizza)
    preparationId: string; // Sous-recette (ex: Sauce Tomate)
    quantity: number; // Quantité de la préparation nécessaire
    unitUse: string; // Unité (ex: litre)
}
    

    