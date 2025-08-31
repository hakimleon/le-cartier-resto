
// Le type pour un ingrédient de base
export type Ingredient = {
    id?: string;
    name: string;
    category: string;
    stockQuantity: number;
    unitPurchase: string; // ex: kg, litre, pièce
    lowStockThreshold: number;
    unitPrice: number;
    supplier: string;
};

// Le type pour une préparation/sous-recette (fiche technique de base)
export type Preparation = {
  id?: string;
  name: string;
  description: string;
  type: 'Préparation'; // Toujours 'Préparation'
  
  // Champs communs
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  duration?: number; // in minutes
  tags?: string[];
  imageUrl?: string;
  
  // Champs Fiche Technique
  procedure_preparation?: string;
  procedure_cuisson?: string;
  procedure_service?: string;
  allergens?: string[];
  
  // Champs spécifiques à la Préparation
  productionQuantity: number; // Quantité produite
  productionUnit: string; // Unité de la quantité produite (kg, litre, pièce)
};

// Le type pour un plat final (fiche technique complète)
export type Recipe = {
  id?: string;
  name: string;
  description: string;
  type: 'Plat'; // Toujours 'Plat'
  
  // Champs communs
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  duration?: number; // in minutes
  tags?: string[];
  imageUrl?: string;
  
  // Champs Fiche Technique
  portions: number;
  procedure_preparation?: string;
  procedure_cuisson?: string;
  procedure_service?: string;
  allergens?: string[];
  commercialArgument?: string;

  // Champs spécifiques au Plat
  price: number; // Prix de vente
  category: | 'Entrées froides et chaudes'
  | 'Plats et Grillades'
  | 'Les mets de chez nous'
  | 'Symphonie de pâtes'
  | 'Nos Burgers Bistronomiques'
  | 'Dessert'
  | 'Élixirs & Rafraîchissements';
  status: 'Actif' | 'Inactif';
  tvaRate?: number; // en pourcentage (ex: 10 pour 10%)
};

// Lien entre une recette/préparation et un ingrédient brut
export type RecipeIngredientLink = {
    recipeId: string; // ID de la recette (Plat) OU de la préparation
    ingredientId: string;
    quantity: number;
    unitUse: string;
};

// Lien entre une recette (Plat) et une sous-recette (Préparation)
export type RecipePreparationLink = {
    id?: string;
    parentRecipeId: string; // L'ID du "Plat"
    childPreparationId: string; // L'ID de la "Préparation"
    quantity: number;
    unitUse: string;
};
