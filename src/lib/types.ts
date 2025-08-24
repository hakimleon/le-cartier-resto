export type Recipe = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: 'Entrée' | 'Plat' | 'Dessert';
  imageUrl?: string;
};
