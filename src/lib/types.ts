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
};
