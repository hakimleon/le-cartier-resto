export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Entrées' | 'Plats Principaux' | 'Desserts' | 'Boissons';
  image: string;
  imageHint: string;
};

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Foie Gras Poêlé',
    description: 'Figues rôties, réduction de balsamique, pain d\'épices maison.',
    price: 28,
    category: 'Entrées',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'gourmet appetizer'
  },
  {
    id: '2',
    name: 'Velouté de Potimarron',
    description: 'Châtaignes grillées, huile de truffe noire.',
    price: 18,
    category: 'Entrées',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'pumpkin soup'
  },
  {
    id: '3',
    name: 'Filet de Boeuf Rossini',
    description: 'Purée de pommes de terre truffée, sauce Périgueux.',
    price: 45,
    category: 'Plats Principaux',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'beef steak'
  },
  {
    id: '4',
    name: 'Saint-Jacques Rôties',
    description: 'Risotto crémeux aux agrumes, asperges vertes.',
    price: 39,
    category: 'Plats Principaux',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'seared scallops'
  },
  {
    id: '5',
    name: 'Sphère en Chocolat',
    description: 'Mousse au chocolat noir, cœur caramel, sauce chocolat chaud.',
    price: 16,
    category: 'Desserts',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chocolate dessert'
  },
  {
    id: '6',
    name: 'Tarte Tatin Revisitée',
    description: 'Pommes caramélisées, crème glacée à la vanille de Tahiti.',
    price: 15,
    category: 'Desserts',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'apple tart'
  },
  {
    id: '7',
    name: 'Château Margaux 2015',
    description: 'Grand cru classé, Bordeaux, France.',
    price: 1200,
    category: 'Boissons',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'red wine'
  },
  {
    id: '8',
    name: 'Eau Minérale Evian',
    description: '75cl',
    price: 8,
    category: 'Boissons',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'water bottle'
  },
];

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
};

export const inventoryItems: InventoryItem[] = [
  { id: 'inv1', name: 'Filet de Boeuf', quantity: 12, unit: 'kg', lowStockThreshold: 5 },
  { id: 'inv2', name: 'Foie Gras', quantity: 5, unit: 'kg', lowStockThreshold: 3 },
  { id: 'inv3', name: 'Pommes de Terre', quantity: 50, unit: 'kg', lowStockThreshold: 20 },
  { id: 'inv4', name: 'Chocolat Noir 70%', quantity: 8, unit: 'kg', lowStockThreshold: 10 },
  { id: 'inv5', name: 'Bouteilles de Château Margaux', quantity: 6, unit: 'bouteilles', lowStockThreshold: 12 },
  { id: 'inv6', name: 'Saint-Jacques', quantity: 4, unit: 'kg', lowStockThreshold: 5 },
  { id: 'inv7', name: 'Farine', quantity: 25, unit: 'kg', lowStockThreshold: 10 },
  { id: 'inv8', name: 'Sucre', quantity: 30, unit: 'kg', lowStockThreshold: 15 },
];

export type Table = {
    id: number;
    seats: number;
    status: 'available' | 'occupied' | 'reserved';
    shape: 'round' | 'square';
}

export const tables: Table[] = [
    { id: 1, seats: 2, status: 'available', shape: 'square' },
    { id: 2, seats: 2, status: 'reserved', shape: 'square' },
    { id: 3, seats: 4, status: 'available', shape: 'round' },
    { id: 4, seats: 4, status: 'occupied', shape: 'square' },
    { id: 5, seats: 4, status: 'available', shape: 'square' },
    { id: 6, seats: 6, status: 'available', shape: 'round' },
    { id: 7, seats: 2, status: 'occupied', shape: 'square' },
    { id: 8, seats: 8, status: 'reserved', shape: 'square' },
    { id: 9, seats: 4, status: 'available', shape: 'round' },
];
