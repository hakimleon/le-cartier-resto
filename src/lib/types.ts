

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
  price: number; // Prix de vente
  category: | 'Entrées froides et chaudes'
  | 'Plats et Grillades'
  | 'Les mets de chez nous'
  | 'Symphonie de pâtes'
  | 'Nos Burgers Bistronomiques'
  | 'Dessert'
  | 'Élixirs & Rafraîchissements';
  status: 'Actif' | 'Inactif';
  imageUrl?: string;
  tags?: string[];
  duration?: number; // in minutes
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  type?: 'Plat'; // Garder ce champ pour la compatibilité future, mais il est fixe pour l'instant
  
  // Fiche Technique Fields
  portions?: number;
  tvaRate?: number; // en pourcentage (ex: 10 pour 10%)
  procedure_preparation?: string;
  procedure_cuisson?: string;
  procedure_service?: string;
  allergens?: string[];
  commercialArgument?: string;
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
    