export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: 'Entrées' | 'Plats Principaux' | 'Desserts' | 'Boissons';
  image: string;
  imageHint: string;
  prepTime: number; // in minutes
  status: 'Actif' | 'Inactif' | 'Saisonnier';
  tags: ('Végétarien' | 'Épicé' | 'Sans gluten' | 'Spécialité locale')[];
  ingredients: { name: string; quantity: string }[];
  instructions: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  allergens: string[];
};

export const categories: ('Entrées' | 'Plats Principaux' | 'Desserts' | 'Boissons')[] = ["Entrées", "Plats Principaux", "Desserts", "Boissons"];
export const tags: ('Végétarien' | 'Épicé' | 'Sans gluten' | 'Spécialité locale')[] = ['Végétarien', 'Épicé', 'Sans gluten', 'Spécialité locale'];

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Foie Gras Poêlé',
    description: 'Figues rôties, réduction de balsamique, pain d\'épices maison.',
    price: 28,
    cost: 12,
    category: 'Entrées',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'gourmet appetizer',
    prepTime: 15,
    status: 'Actif',
    tags: ['Spécialité locale'],
    ingredients: [
      { name: 'Foie gras de canard', quantity: '1 tranche (80g)' },
      { name: 'Figues fraîches', quantity: '2' },
      { name: 'Vinaigre balsamique', quantity: '30ml' },
      { name: 'Pain d\'épices', quantity: '1 tranche' },
    ],
    instructions: 'Poêler le foie gras 1-2 minutes de chaque côté. Déglacer avec le vinaigre balsamique. Servir chaud avec les figues rôties et le pain d\'épices.',
    difficulty: 3,
    allergens: ['Gluten'],
  },
  {
    id: '2',
    name: 'Velouté de Potimarron',
    description: 'Châtaignes grillées, huile de truffe noire.',
    price: 18,
    cost: 6,
    category: 'Entrées',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'pumpkin soup',
    prepTime: 20,
    status: 'Saisonnier',
    tags: ['Végétarien', 'Sans gluten'],
    ingredients: [
        { name: 'Potimarron', quantity: '300g' },
        { name: 'Châtaignes', quantity: '50g' },
        { name: 'Huile de truffe', quantity: '5ml' },
        { name: 'Crème liquide', quantity: '50ml' },
    ],
    instructions: 'Cuire le potimarron puis mixer avec la crème. Ajouter les châtaignes grillées et un filet d\'huile de truffe avant de servir.',
    difficulty: 2,
    allergens: ['Lactose'],
  },
  {
    id: '3',
    name: 'Filet de Boeuf Rossini',
    description: 'Purée de pommes de terre truffée, sauce Périgueux.',
    price: 45,
    cost: 18,
    category: 'Plats Principaux',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'beef steak',
    prepTime: 30,
    status: 'Actif',
    tags: ['Spécialité locale'],
    ingredients: [
        { name: 'Filet de boeuf', quantity: '180g' },
        { name: 'Escalope de foie gras', quantity: '50g' },
        { name: 'Truffe noire', quantity: '10g' },
        { name: 'Pommes de terre', quantity: '200g' },
    ],
    instructions: 'Cuire le filet de boeuf à la cuisson désirée. Poêler l\'escalope de foie gras. Servir sur le filet avec une purée truffée et la sauce Périgueux.',
    difficulty: 4,
    allergens: ['Lactose'],
  },
  {
    id: '4',
    name: 'Saint-Jacques Rôties',
    description: 'Risotto crémeux aux agrumes, asperges vertes.',
    price: 39,
    cost: 15,
    category: 'Plats Principaux',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'seared scallops',
    prepTime: 25,
    status: 'Saisonnier',
    tags: [],
    ingredients: [
        { name: 'Noix de Saint-Jacques', quantity: '5' },
        { name: 'Riz Arborio', quantity: '80g' },
        { name: 'Asperges vertes', quantity: '100g' },
        { name: 'Agrumes (citron, orange)', quantity: '1' },
    ],
    instructions: 'Préparer le risotto. Poêler les Saint-Jacques et cuire les asperges. Dresser harmonieusement.',
    difficulty: 3,
    allergens: ['Mollusques', 'Lactose'],
  },
  {
    id: '5',
    name: 'Sphère en Chocolat',
    description: 'Mousse au chocolat noir, cœur caramel, sauce chocolat chaud.',
    price: 16,
    cost: 5,
    category: 'Desserts',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chocolate dessert',
    prepTime: 20,
    status: 'Actif',
    tags: [],
    ingredients: [
        { name: 'Chocolat noir 70%', quantity: '100g' },
        { name: 'Sucre', quantity: '50g' },
        { name: 'Crème liquide', quantity: '100ml' },
        { name: 'Beurre salé', quantity: '20g' },
    ],
    instructions: 'Créer la sphère en chocolat. Garnir de mousse. Préparer le caramel. Verser la sauce chocolat chaud au moment de servir pour faire fondre la sphère.',
    difficulty: 5,
    allergens: ['Lactose', 'Soja'],
  },
  {
    id: '6',
    name: 'Tarte Tatin Revisitée',
    description: 'Pommes caramélisées, crème glacée à la vanille de Tahiti.',
    price: 15,
    cost: 4,
    category: 'Desserts',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'apple tart',
    prepTime: 25,
    status: 'Actif',
    tags: ['Spécialité locale'],
    ingredients: [
      { name: 'Pommes Golden', quantity: '2' },
      { name: 'Pâte feuilletée', quantity: '100g' },
      { name: 'Sucre', quantity: '80g' },
      { name: 'Glace vanille', quantity: '1 boule' },
    ],
    instructions: 'Caraméliser les pommes. Recouvrir de pâte feuilletée et cuire au four. Servir tiède avec une boule de glace vanille.',
    difficulty: 2,
    allergens: ['Gluten', 'Lactose'],
  },
  {
    id: '7',
    name: 'Château Margaux 2015',
    description: 'Grand cru classé, Bordeaux, France.',
    price: 1200,
    cost: 600,
    category: 'Boissons',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'red wine',
    prepTime: 5,
    status: 'Inactif',
    tags: [],
    ingredients: [],
    instructions: '',
    difficulty: 1,
    allergens: ['Sulfites'],
  },
  {
    id: '8',
    name: 'Eau Minérale Evian',
    description: '75cl',
    price: 8,
    cost: 1,
    category: 'Boissons',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'water bottle',
    prepTime: 1,
    status: 'Actif',
    tags: [],
    ingredients: [],
    instructions: '',
    difficulty: 1,
    allergens: [],
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

export type PerformanceData = {
  menuItemId: string;
  totalSales: number; // units sold last month
};

export const menuPerformanceData: PerformanceData[] = [
  { menuItemId: '1', totalSales: 150 }, // Foie Gras Poêlé (Puzzle)
  { menuItemId: '2', totalSales: 220 }, // Velouté de Potimarron (Plowhorse)
  { menuItemId: '3', totalSales: 300 }, // Filet de Boeuf Rossini (Star)
  { menuItemId: '4', totalSales: 180 }, // Saint-Jacques Rôties (Star)
  { menuItemId: '5', totalSales: 250 }, // Sphère en Chocolat (Star)
  { menuItemId: '6', totalSales: 80 }, // Tarte Tatin Revisitée (Dog)
  { menuItemId: '7', totalSales: 5 },   // Château Margaux (Dog)
  { menuItemId: '8', totalSales: 400 }, // Eau Minérale Evian (Plowhorse)
];
