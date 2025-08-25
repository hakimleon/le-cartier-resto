export type Recipe = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: | 'Entrées froides et chaudes'
  | 'Plats'
  | 'Les mets de chez nous'
  | 'Symphonie de pâtes'
  | 'Humburgers'
  | 'Dessert';
  imageUrl?: string;
  status?: 'Actif' | 'Inactif';
  tags?: string[];
  duration?: number; // in minutes
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
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
