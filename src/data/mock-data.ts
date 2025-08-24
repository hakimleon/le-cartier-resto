
// src/data/mock-data.ts
import { Recipe, RecipeIngredient } from './definitions';

// The Omit type was incorrect. The mock data should conform to the Recipe type as much as possible.
// Fields like 'cost' will be calculated later, so they can be optional or have a default value here.
export const mockRecipes: Recipe[] = [
  // --- Entrées ---
  {
    id: 'ef-1',
    name: "Oeuf cremeux a la mayo maison au couleurs locales",
    description: "oeuf dur nappe avec une mayonnaise onctueuse montee a la main",
    category: 'Entrées',
    price: 900,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'creamy egg',
    prepTime: 10,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Végétarien'],
    procedure: {
      preparation: [
        "Faire cuire l'oeuf pour qu'il soit dur.",
        "Préparer une mayonnaise maison en montant l'huile avec le jaune d'oeuf et la moutarde."
      ],
      cuisson: [],
      service: [
        "Napper généreusement l'oeuf dur avec la mayonnaise."
      ]
    },
    allergens: ['Oeuf', 'Moutarde']
  },
  {
    id: 'ef-2',
    name: 'Caprice Méditerranéen',
    description: 'Duo de tomate et mozzarella aux herbes fraîches',
    category: 'Entrées',
    price: 1200,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'caprese salad',
    prepTime: 10,
    difficulty: 1,
    status: 'Actif',
    tags: ['Végétarien', 'Frais', 'Léger', 'Vegan'],
    procedure: {
      preparation: [
        'Couper les tomates en rondelles régulières.',
        'Alterner les tranches de tomate et de mozzarella sur une assiette.',
        'Ajouter des feuilles de basilic frais.'
      ],
      cuisson: [],
      service: [
        'Assaisonner d’un filet d’huile d’olive, sel et poivre.'
      ]
    },
    allergens: ['Lactose']
  },
  {
    id: 'ec-1',
    name: 'Douceur de Camembert en Croûte d’Herbes',
    description: 'Camembert grillé, pesto frais et éclats de noix',
    category: 'Entrées',
    price: 950,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'baked camembert',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Chaud', 'Gourmand'],
    procedure: {
      preparation: [
        'Enrober le camembert d\'un pesto maison et d\'éclats de noix.'
      ],
      cuisson: [
        'Passer au four jusqu\'à ce qu\'il soit fondant.'
      ],
      service: []
    },
    allergens: ['Lactose', 'Noix']
  },
   {
    id: 'ef-16',
    name: 'Bruschetta aux Champignons',
    description: 'Champignons sautés à l\'ail et au persil sur pain grillé',
    category: 'Entrées',
    price: 1150,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'bruschetta mushroom',
    prepTime: 12,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Frais', 'Léger'],
    procedure: {
      preparation: [
        'Sauter les champignons avec de l\'ail et du persil.',
        'Garnir le pain grillé.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten']
  },
  // --- Plats ---
  {
    id: 'pg-14',
    name: 'L’Entrecôte Signature Grillée',
    description: 'Entrecôte juteuse grillée à la perfection',
    category: 'Plats',
    price: 2600,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'ribeye steak',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Saisir l\'entrecôte sur un grill bien chaud.'
      ],
      cuisson: [],
      service: [
        'Laisser reposer quelques minutes avant de servir.'
      ]
    },
    allergens: []
  },
  {
    id: 'pg-16',
    name: 'Filet Majestueux des Prairies',
    description: 'Filet de bœuf grillé au jus réduit, purée truffée en option',
    category: 'Plats',
    price: 3200,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'beef fillet',
    prepTime: 30,
    difficulty: 4,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Griller le filet de boeuf à la cuisson désirée.'
      ],
      cuisson: [],
      service: [
        'Servir avec un jus de viande réduit.',
        'Proposer une purée maison à l\'huile de truffe en accompagnement.'
      ]
    },
    allergens: []
  },
  {
    id: 'lmdcn-2',
    name: 'Rechta Royale algeroise au Poulet',
    description: 'Rechta de pate fraiche avec poulet parfumée à la cannelle',
    category: 'Plats',
    price: 2400,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'rechta chicken',
    prepTime: 35,
    difficulty: 4,
    status: 'Actif',
    tags: ['Spécialité locale', 'Principal'],
    procedure: {
      preparation: [
        'Cuire la rechta à la vapeur.',
        'Préparer un bouillon avec le poulet, des légumes (courgettes, navets) et parfumé à la cannelle.'
      ],
      cuisson: [],
      service: [
        'Servir la rechta nappée de bouillon.'
      ]
    },
    allergens: ['Gluten']
  },
  {
    id: 'sp-7',
    name: 'Écume Boréale au Saumon',
    description: 'Tagliatelles fondantes, saumon fumé, crème légère au parmesan',
    category: 'Plats',
    price: 2200,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'salmon pasta',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Italien', 'Pâtes', 'Poisson'],
    procedure: {
      preparation: [
        'Préparer une sauce crémeuse.',
        'Ajouter des morceaux de saumon fumé.'
      ],
      cuisson: [],
      service: [
        'Napper les tagliatelles cuites.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Poisson']
  },
  // --- Burgers ---
  {
    id: 'burg-1',
    name: 'Burger Gourmet de boeuf',
    description: 'Patty de boeuf haché de 180 gr, pain brioche maison, tomate et laitue romane.',
    category: 'Burgers',
    price: 1800,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'gourmet burger',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Burger', 'Américain'],
    procedure: {
      preparation: [
        'Griller le steak haché à la cuisson désirée.'
      ],
      cuisson: [],
      service: [
        'Monter le burger dans le pain brioché avec de la laitue, une tranche de tomate et la sauce maison.'
      ]
    },
    allergens: ['Gluten', 'Lactose']
  },
  // --- Desserts ---
  {
    id: 'des-1',
    name: 'Tentation Chocolat Intense',
    description: 'Fondant cœur coulant, servi tiède avec son voile de crème anglaise',
    category: 'Desserts',
    price: 1400,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chocolate fondant',
    prepTime: 15,
    difficulty: 3,
    status: 'Actif',
    tags: ['Dessert', 'Sucré'],
    procedure: {
      preparation: [
        'Préparer la pâte à fondant.',
        'Remplir des moules individuels et cuire quelques minutes pour garder un coeur coulant.'
      ],
      cuisson: [],
      service: [
        'Servir tiède avec de la crème anglaise.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  // --- Boissons ---
  {
    id: 'boi-6',
    name: 'Cocktail Signature Sans Alcool',
    description: 'Mélange de fruits frais, touche florale',
    category: 'Boissons',
    price: 1200,
    cost: 0,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'fruit mocktail',
    prepTime: 5,
    difficulty: 2,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  }
];

export const mockRecipeIngredients: RecipeIngredient[] = [
    { id: 'ri-ef1-1', recipeId: 'ef-1', ingredientId: 'ing-13', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-ef2-1', recipeId: 'ef-2', ingredientId: 'ing-1', quantity: 150, unitUse: 'g' },
    { id: 'ri-ef2-2', recipeId: 'ef-2', ingredientId: 'ing-2', quantity: 125, unitUse: 'g' },
    { id: 'ri-pg14-1', recipeId: 'pg-14', ingredientId: 'ing-4', quantity: 250, unitUse: 'g' },
    { id: 'ri-pg16-1', recipeId: 'pg-16', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-lmdcn-2-1', recipeId: 'lmdcn-2', ingredientId: 'ing-9', quantity: 200, unitUse: 'g' },
    { id: 'ri-lmdcn-2-2', recipeId: 'lmdcn-2', ingredientId: 'ing-4', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-sp7-1', recipeId: 'sp-7', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp7-2', recipeId: 'sp-7', ingredientId: 'ing-7', quantity: 100, unitUse: 'g' },
    { id: 'ri-sp7-3', recipeId: 'sp-7', ingredientId: 'ing-12', quantity: 50, unitUse: 'ml' },
    { id: 'ri-burg1-1', recipeId: 'burg-1', ingredientId: 'ing-4', quantity: 180, unitUse: 'g' },
    { id: 'ri-burg1-2', recipeId: 'burg-1', ingredientId: 'ing-1', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-des1-1', recipeId: 'des-1', ingredientId: 'ing-11', quantity: 70, unitUse: 'g' },
    { id: 'ri-des1-2', recipeId: 'des-1', ingredientId: 'ing-13', quantity: 1, unitUse: 'pièce' },
];

    
