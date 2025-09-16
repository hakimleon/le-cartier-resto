

// Le type pour un ingrédient de base
export type Ingredient = {
    id?: string;
    name: string;
    category: string;
    stockQuantity: number;
    lowStockThreshold: number;
    supplier?: string;

    // Nouvelle structure pour le prix et le rendement
    purchasePrice: number;        // Prix d'achat (ex: 150 pour une botte)
    purchaseUnit: string;         // Unité d'achat (ex: "botte", "kg", "pièce", "l")
    purchaseWeightGrams: number;  // Poids en grammes de l'unité d'achat (pour les solides ET les liquides, on assume 1ml=1g)
    yieldPercentage: number;      // Rendement en pourcentage (ex: 60 pour 60%)
};

// Types pour la génération de recette par l'IA
export type GeneratedIngredient = {
    name: string;
    quantity: number;
    unit: string;
};


// Le type pour une préparation/sous-recette (fiche technique de base)
export type Preparation = {
  id?: string;
  type: 'Préparation'; // Champ ajouté pour la cohérence
  name: string;
  description: string;
  
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
  productionQuantity?: number; // Quantité produite
  productionUnit?: string; // Unité de la quantité produite (kg, litre, pièce)
  usageUnit?: string; // Unité d'utilisation suggérée (g, ml, pièce)
};

// Le type pour un plat final (fiche technique complète)
export type Recipe = {
  id?: string;
  type: 'Plat'; // Toujours 'Plat'
  name: string;
  description: string;
  
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
    id?: string;
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

// Utilisé pour passer des données complètes aux composants clients
export type FullRecipeIngredient = {
    id: string; // Ingredient ID
    recipeIngredientId: string; // The ID of the document in recipeIngredients collection
    name: string;
    quantity: number;
    unit: string;
    category: string;
    totalCost: number;
};

  