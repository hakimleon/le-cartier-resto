// src/data/mock-data.ts
import { Recipe, RecipeIngredient } from './definitions';

export const mockRecipes: Omit<Recipe, 'cost' | 'argumentationCommerciale'>[] = [
  // --- Entrées Froides ---
  {
    id: 'ef-1',
    name: "Oeuf cremeux a la mayo maison au couleurs locales",
    description: "oeuf dur nappe avec une mayonnaise onctueuse montee a la main",
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 900,
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
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1200,
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
    id: 'ef-3',
    name: 'L’Éveil Césarien',
    description: 'Salade croquante, filet de volaille, copeaux de parmesan et sauce César maison',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'caesar salad',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger'],
    procedure: {
      preparation: [
        'Griller le filet de poulet et le couper en lamelles.',
        'Préparer la sauce César.'
      ],
      cuisson: [],
      service: [
        'Assembler la salade avec la laitue, le poulet, les croûtons et les copeaux de parmesan.',
        'Napper de sauce.'
      ]
    },
    allergens: ['Lactose', 'Gluten']
  },
  {
    id: 'ef-4',
    name: 'Brume Nordique',
    description: 'Éventail de saumon mariné sur lit de verdure et fraîcheur citronnée',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1700,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'salmon salad',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Poisson'],
    procedure: {
      preparation: [
        'Mariner le saumon avec du jus de citron, de l\'aneth et de l\'huile d\'olive.'
      ],
      cuisson: [],
      service: [
        'Le disposer en éventail sur un lit de salade.',
        'Servir frais.'
      ]
    },
    allergens: ['Poisson']
  },
  {
    id: 'ef-5',
    name: 'Étreinte Marine',
    description: 'Salade de poulpe tendre aux notes d’agrumes et huile d’olive vierge',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'octopus salad',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Mollusques'],
    procedure: {
      preparation: [
        'Cuire le poulpe jusqu\'à ce qu\'il soit tendre.'
      ],
      cuisson: [],
      service: [
        'Le couper en morceaux et l\'assaisonner avec le jus des agrumes, l\'huile d\'olive, du persil frais, du sel et du poivre.'
      ]
    },
    allergens: ['Mollusques']
  },
  {
    id: 'ef-6',
    name: 'Palette Fromagère du Maître Affineur',
    description: 'Sélection raffinée de fromages affinés, fruits secs et pain artisanal',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1700,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'cheese platter',
    prepTime: 10,
    difficulty: 1,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Végétarien'],
    procedure: {
      preparation: [
        'Disposer harmonieusement les fromages sur une planche.'
      ],
      cuisson: [],
      service: [
        'Accompagner de fruits secs (noix, figues) et de tranches de pain artisanal.'
      ]
    },
    allergens: ['Lactose', 'Gluten', 'Noix']
  },
  {
    id: 'ef-7',
    name: 'Jardin des Mers',
    description: 'Avocats, crevettes roses et saumon fumé, touche de mangue et citron vert',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'shrimp salad',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Crustacés', 'Poisson'],
    procedure: {
      preparation: [
        'Couper l\'avocat et la mangue en dés.',
        'Mélanger avec les crevettes et le saumon fumé.'
      ],
      cuisson: [],
      service: [
        'Assaisonner avec du jus de citron vert, sel et poivre.'
      ]
    },
    allergens: ['Crustacés', 'Poisson']
  },
  {
    id: 'ef-8',
    name: 'Bulle de Burrata',
    description: 'Burrata crémeuse, perles de grenade, roquette et huile',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'burrata salad',
    prepTime: 10,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Frais', 'Léger', 'Vegan'],
    procedure: {
      preparation: [
        'Déposer la burrata sur un lit de roquette.',
        'Parsemer de perles de grenade.'
      ],
      cuisson: [],
      service: [
        'Arroser d\'un filet d\'huile d\'olive et de vinaigre balsamique.'
      ]
    },
    allergens: ['Lactose']
  },
  {
    id: 'ef-9',
    name: 'Lames de Bœuf au Soleil d’Italie',
    description: 'Carpaccio de bœuf, copeaux de parmesan, huile d’olive et roquette',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'beef carpaccio',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger'],
    procedure: {
      preparation: [
        'Disposer finement les tranches de boeuf sur une assiette.'
      ],
      cuisson: [],
      service: [
        'Ajouter les copeaux de parmesan, la roquette, un filet d\'huile d\'olive, du sel et du poivre.'
      ]
    },
    allergens: ['Lactose']
  },
  {
    id: 'ef-10',
    name: 'Trésor des Abysses',
    description: 'Mélange raffiné de fruits de mer aux herbes fraîches',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'seafood salad',
    prepTime: 15,
    difficulty: 3,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Crustacés', 'Mollusques'],
    procedure: {
      preparation: [
        'Cuire et refroidir les fruits de mer.'
      ],
      cuisson: [],
      service: [
        'Les mélanger avec des herbes fraîches ciselées (persil, ciboulette), un filet de jus de citron et de l\'huile d\'olive.'
      ]
    },
    allergens: ['Crustacés', 'Mollusques']
  },
  {
    id: 'ef-11',
    name: 'L’Inspiration du Chef',
    description: 'Symphonie de poulet pané, noix, avocat, œuf dur et balsamique perlé',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken salad',
    prepTime: 15,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger'],
    procedure: {
      preparation: [
        'Assembler la salade avec le poulet pané et coupé, les cerneaux de noix, les tranches d\'avocat et les quartiers d\'oeuf dur.'
      ],
      cuisson: [],
      service: [
        'Assaisonner avec une vinaigrette au balsamique.'
      ]
    },
    allergens: ['Gluten', 'Noix', 'Oeuf']
  },
  {
    id: 'ef-12',
    name: 'Bruschetta Provençale',
    description: 'Tomate confite, mozzarella fondante, sauce pesto basilic',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1100,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'bruschetta tomato',
    prepTime: 10,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Frais', 'Léger', 'Vegan'],
    procedure: {
      preparation: [
        'Frotter les tranches de pain avec de l\'ail.',
        'Garnir de tomates confites et de mozzarella.'
      ],
      cuisson: [
        'Passer au four jusqu\'à ce que le fromage soit fondu.'
      ],
      service: [
        'Napper de pesto.'
      ]
    },
    allergens: ['Gluten', 'Lactose']
  },
  {
    id: 'ef-13',
    name: 'Bruschetta Douceur d’Épicure',
    description: 'Camembert chaud, figues fraîches, miel doré et noix croquantes',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'bruschetta cheese',
    prepTime: 12,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Frais', 'Léger'],
    procedure: {
      preparation: [
        'Garnir les tranches de pain de camembert et de rondelles de figues.'
      ],
      cuisson: [
        'Napper de miel et passer au four.'
      ],
      service: [
        'Parsemer de noix concassées.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Noix']
  },
  {
    id: 'ef-14',
    name: 'Bruschetta Nordique Enchantée',
    description: 'Saumon fumé, avocat crémeux, fromage à l’ail et zeste citronné',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 1600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'bruschetta salmon',
    prepTime: 12,
    difficulty: 2,
    status: 'Actif',
    tags: ['Frais', 'Léger', 'Poisson'],
    procedure: {
      preparation: [
        'Tartiner le pain avec du fromage à l\'ail et fines herbes.',
        'Ajouter des tranches d\'avocat et du saumon fumé.'
      ],
      cuisson: [],
      service: [
        'Finir avec un zeste de citron.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Poisson']
  },
  {
    id: 'ef-15',
    name: 'Salade Algeroise fraicheur',
    description: 'salade du jardin locale , tomates, concombres, poivrons et herbes fraiches',
    category: 'Entrées Froides – Fraîcheur et Élégance',
    price: 800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'algerian salad',
    prepTime: 10,
    difficulty: 1,
    status: 'Actif',
    tags: ['Végétarien', 'Spécialité locale', 'Frais', 'Léger', 'Vegan'],
    procedure: {
      preparation: [
        'Couper les légumes en petits dés.'
      ],
      cuisson: [],
      service: [
        'Assaisonner avec de l\'huile d\'olive, du sel, du poivre et des herbes fraîches comme la menthe et la coriandre.'
      ]
    },
    allergens: []
  },
  // --- Entrées Chaudes ---
  {
    id: 'ec-1',
    name: 'Douceur de Camembert en Croûte d’Herbes',
    description: 'Camembert grillé, pesto frais et éclats de noix',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 950,
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
    id: 'ec-2',
    name: 'Camembert en Manteau Doré',
    description: 'Pané, nappé de miel et parsemé de noix caramélisées',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 1200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'fried camembert',
    prepTime: 15,
    difficulty: 3,
    status: 'Actif',
    tags: ['Végétarien', 'Chaud', 'Gourmand'],
    procedure: {
      preparation: [
        'Paner le camembert (farine, oeuf, chapelure) et le frire jusqu\'à ce qu\'il soit doré.'
      ],
      cuisson: [],
      service: [
        'Napper de miel et de noix caramélisées.'
      ]
    },
    allergens: ['Lactose', 'Noix', 'Gluten', 'Oeuf']
  },
  {
    id: 'ec-3',
    name: 'Gratin d’Automne aux Bois d’Or',
    description: 'Émincé de poulet aux champignons, gratiné au fromage',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 1200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken gratin',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Chaud', 'Gourmand'],
    procedure: {
      preparation: [
        'Faire revenir le poulet émincé avec les champignons.',
        'Napper d\'une sauce béchamel, couvrir de fromage et gratiner au four.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Lactose', 'Gluten']
  },
  {
    id: 'ec-4',
    name: 'Gratin des Océans',
    description: 'Crevettes royales en gratin onctueux à la crème d’ail doux',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 1400,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'shrimp gratin',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Chaud', 'Gourmand', 'Crustacés'],
    procedure: {
      preparation: [
        'Faire revenir les crevettes à l\'ail.',
        'Ajouter la crème, assaisonner.'
      ],
      cuisson: [
        'Verser dans un plat à gratin, couvrir de fromage et faire dorer.'
      ],
      service: []
    },
    allergens: ['Lactose', 'Crustacés', 'Gluten']
  },
  {
    id: 'ec-5',
    name: 'Omelette Signature au Jardin Secret',
    description: 'Aux herbes fraîches, fromage fondant et champignons de saison',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 900,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'omelette cheese',
    prepTime: 10,
    difficulty: 1,
    status: 'Actif',
    tags: ['Végétarien', 'Chaud', 'Gourmand'],
    procedure: {
      preparation: [
        'Battre les oeufs avec les herbes ciselées.'
      ],
      cuisson: [
        'Verser dans une poêle chaude, ajouter les champignons sautés et le fromage.'
      ],
      service: [
        'Replier et servir.'
      ]
    },
    allergens: ['Oeuf', 'Lactose']
  },
  {
    id: 'ec-6',
    name: 'Souffle du Jour',
    description: 'Potage maison selon l’inspiration du marché',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 900,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'soup day',
    prepTime: 15,
    difficulty: 2,
    status: 'Saisonnier',
    tags: ['Végétarien', 'Chaud', 'Gourmand', 'Vegan'],
    procedure: {
      preparation: [
        'Cuire les légumes de saison dans un bouillon.'
      ],
      cuisson: [
        'Mixer jusqu\'à obtenir une consistance veloutée.'
      ],
      service: [
        'Servir chaud.'
      ]
    },
    allergens: []
  },
  {
    id: 'ec-7',
    name: 'Perles d’Écume Croquantes',
    description: 'Crevettes tempura en robe dorée, sauce légère au yuzu',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 2000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'shrimp tempura',
    prepTime: 15,
    difficulty: 3,
    status: 'Actif',
    tags: ['Chaud', 'Gourmand', 'Crustacés'],
    procedure: {
      preparation: [
        'Préparer la pâte à tempura.',
        'Enrober les crevettes et les frire dans une huile chaude jusqu\'à ce qu\'elles soient dorées et croustillantes.'
      ],
      cuisson: [],
      service: [
        'Servir avec une sauce yuzu.'
      ]
    },
    allergens: ['Crustacés', 'Gluten']
  },
  {
    id: 'ec-8',
    name: 'Tchekchouka maison au Chorizo',
    description: 'Tchekchouka algerienne aux poivrons et du chorizo locale',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 1100,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'shakshuka chorizo',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Spécialité locale', 'Épicé', 'Chaud', 'Gourmand'],
    procedure: {
      preparation: [
        'Faire revenir les poivrons et les tomates en morceaux dans de l\'huile d\'olive.',
        'Ajouter le chorizo en rondelles et laisser mijoter jusqu\'à épaississement.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'ec-9',
    name: 'Tchekchouka Gourmande au Merguez',
    description: 'Tchekchouka algerienne aux poivrons et relevee par de la saucice locale et fraiche',
    category: 'Entrées Chaudes – Gourmandise et Chaleur',
    price: 1300,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'shakshuka merguez',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Spécialité locale', 'Épicé', 'Chaud', 'Gourmand'],
    procedure: {
      preparation: [
        'Faire revenir les poivrons et les tomates.',
        'Faire griller les merguez à part, les couper en morceaux et les ajouter à la sauce.',
        'Laisser mijoter.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  // --- Plats et Grillades ---
  {
    id: 'pg-1',
    name: 'Cordon bleu au bacon maison',
    description: 'Poulet, fromage et bacon',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'cordon bleu',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Aplatir le filet de poulet.',
        'Le farcir de fromage et de bacon.'
      ],
      cuisson: [
        'Le refermer, le paner et le cuire à la poêle.'
      ],
      service: []
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  {
    id: 'pg-2',
    name: 'Suprême de Volaille au Feu de Bois',
    description: 'Blanc de poulet grillé, marinade douce et herbes fraîches',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 1700,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'grilled chicken',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Principal', 'Grillade', 'Végétarien'],
    procedure: {
      preparation: [
        'Mariner le blanc de poulet dans une marinade à base d\'herbes, d\'ail et d\'huile d\'olive.'
      ],
      cuisson: [
        'Le griller au feu de bois ou au grill.'
      ],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-3',
    name: 'Soleil d’Orient au Curry Doux',
    description: 'Émincé de poulet nappé de sauce onctueuse au curry doré',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 1850,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken curry',
    prepTime: 25,
    difficulty: 2,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Faire dorer le poulet émincé.'
      ],
      cuisson: [
        'Ajouter le curry et la crème, laisser mijoter jusqu\'à obtenir une sauce onctueuse.'
      ],
      service: []
    },
    allergens: ['Lactose']
  },
  {
    id: 'pg-4',
    name: 'Tendresse Croustillante du Chef',
    description: 'Filets de poulet panés à la chapelure dorée, sauce légère',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 1900,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'crispy chicken',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Paner les filets de poulet et les frire jusqu\'à ce qu\'ils soient dorés et croustillants.'
      ],
      cuisson: [],
      service: [
        'Servir avec une sauce au choix.'
      ]
    },
    allergens: ['Gluten', 'Oeuf']
  },
  {
    id: 'pg-5',
    name: 'Volcan Mexicain',
    description: 'Poulet mariné aux épices piquantes et poivrons sautés',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 1900,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'mexican chicken',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Épicé', 'Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Mariner le poulet avec les épices mexicaines.'
      ],
      cuisson: [
        'Le faire sauter avec des lanières de poivrons et d\'oignons.'
      ],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-6',
    name: 'Secrets de la Ferme Marinée',
    description: 'Cuisse de poulet tendre et juteuse aux saveurs maison',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 1900,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'marinated chicken',
    prepTime: 30,
    difficulty: 2,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Mariner la cuisse de poulet dans une marinade signature pendant plusieurs heures.'
      ],
      cuisson: [
        'La rôtir au four jusqu\'à ce qu\'elle soit bien dorée.'
      ],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-7',
    name: 'Crousti-Fondant à la Crème Fromagère',
    description: 'Escalope panée, fondue de fromage affiné',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 1950,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken cheese',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Paner l\'escalope et la cuire.'
      ],
      cuisson: [],
      service: [
        'Préparer une sauce fromagère onctueuse et napper l\'escalope.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  {
    id: 'pg-8',
    name: 'Suprême Forestier',
    description: 'Blanc de poulet, crème de champignons et éclats d’ail doux',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken mushroom',
    prepTime: 25,
    difficulty: 2,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Cuire le blanc de poulet.',
        'Préparer une sauce crémeuse aux champignons et à l\'ail.'
      ],
      cuisson: [],
      service: [
        'Napper le poulet de sauce.'
      ]
    },
    allergens: ['Lactose']
  },
  {
    id: 'pg-9',
    name: 'Poulet a la Toscane',
    description: 'Poulet avec sa sauce cremeuse au Parmesan tomates confites et pousse de blettes (epinards)',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2100,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'tuscan chicken',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Faire dorer le poulet.'
      ],
      cuisson: [
        'Ajouter la crème, le parmesan, les tomates confites et les pousses d\'épinards.',
        'La laisser mijoter.'
      ],
      service: []
    },
    allergens: ['Lactose']
  },
  {
    id: 'pg-10',
    name: 'Cœur de Poulet Farci Gourmand',
    description: 'Viande hachée, fromage coulant, sauce fromagère',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'stuffed chicken',
    prepTime: 30,
    difficulty: 4,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Farcir le blanc de poulet avec la viande hachée et le fromage.'
      ],
      cuisson: [],
      service: [
        'Le cuire au four et napper d\'une sauce fromagère.'
      ]
    },
    allergens: ['Lactose']
  },
  {
    id: 'pg-11',
    name: 'Bleu Royal au Poulet',
    description: 'Cordon bleu maison, sauce crémeuse aux fromages affinés',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'royal chicken',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Préparer un cordon bleu en remplaçant le fromage classique par du bleu.'
      ],
      cuisson: [],
      service: [
        'Servir avec une sauce crémeuse aux fromages.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  {
    id: 'pg-12',
    name: 'Tendre Alliance du Terroir',
    description: 'Steak haché de bœuf garni au fromage fondant',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2400,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'beef steak',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Former deux steaks hachés fins.',
        'Placer le fromage entre les deux et bien souder les bords.'
      ],
      cuisson: [
        'Griller à la cuisson désirée.'
      ],
      service: []
    },
    allergens: ['Lactose']
  },
  {
    id: 'pg-13',
    name: 'Tex-Mex Passion',
    description: 'Émincé de bœuf épicé façon mexicaine, légumes croquants',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'tex-mex beef',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Épicé', 'Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Émincer le boeuf et le faire sauter avec des épices mexicaines, des poivrons et des oignons.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-14',
    name: 'L’Entrecôte Signature Grillée',
    description: 'Entrecôte juteuse grillée à la perfection',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 2600,
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
    id: 'pg-15',
    name: 'Perles d’Agneau Grillées',
    description: 'Noisettes d’agneau tendres et parfumées aux herbes',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 3000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'grilled lamb',
    prepTime: 25,
    difficulty: 4,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Mariner les noisettes d\'agneau avec les herbes et les griller à la cuisson rosée.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-16',
    name: 'Filet Majestueux des Prairies',
    description: 'Filet de bœuf grillé au jus réduit, purée truffée en option',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 3200,
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
    id: 'pg-17',
    name: 'Agneau des Mille et Une Nuits',
    description: 'Méchooui traditionnel à l’orientale, épices et fondant',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 3500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'mechoui lamb',
    prepTime: 45,
    difficulty: 4,
    status: 'Actif',
    tags: ['Spécialité locale', 'Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Cuire l\'épaule d\'agneau longuement à basse température avec des épices orientales jusqu\'à ce qu\'elle soit confite.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-18',
    name: 'Assiette du Boucher d’Exception',
    description: 'Entrecôte, noisettes d’agneau, poulet mariné, merguez grillée',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 4000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'mixed grill',
    prepTime: 30,
    difficulty: 4,
    status: 'Actif',
    tags: ['Principal', 'Grillade'],
    procedure: {
      preparation: [
        'Griller les différentes viandes à la perfection et les servir sur une même assiette.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'pg-19',
    name: 'Panier des Mers Signature',
    description: 'Assortiment de poissons grillés selon arrivage',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 4000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'grilled fish',
    prepTime: 30,
    difficulty: 3,
    status: 'Saisonnier',
    tags: ['Principal', 'Grillade', 'Poisson'],
    procedure: {
      preparation: [
        'Griller la sélection de poissons frais du jour et servir avec une sauce vierge.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Poisson']
  },
  {
    id: 'pg-20',
    name: 'Paella Marina Royale',
    description: 'Riz safrané aux fruits de mer et légumes du soleil',
    category: 'Plats et Grillades – Saveurs en Majesté',
    price: 3000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'seafood paella',
    prepTime: 40,
    difficulty: 4,
    status: 'Actif',
    tags: ['Principal', 'Grillade', 'Crustacés', 'Mollusques'],
    procedure: {
      preparation: [
        'Préparer un sofrito, ajouter le riz, le safran et le bouillon.',
        'Incorporer les fruits de mer et les légumes et laisser cuire.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Crustacés', 'Mollusques']
  },
  // --- Les Mets de chez Nous ---
  {
    id: 'lmdcn-1',
    name: 'Foie de Veau a la Persillade d\'Alger, ( Kabda Mechermla)',
    description: 'Émincé de foie de veau, bouquet d’ail et persil façon Dz',
    category: 'Les Mets de chez Nous',
    price: 2200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'veal liver',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Spécialité locale', 'Principal'],
    procedure: {
      preparation: [
        'Couper le foie de veau en fines tranches.',
        'Le saisir rapidement dans une poêle chaude avec de l\'ail et du persil hachés.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'lmdcn-2',
    name: 'Rechta Royale algeroise au Poulet',
    description: 'Rechta de pate fraiche avec poulet parfumée à la cannelle',
    category: 'Les Mets de chez Nous',
    price: 2400,
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
    id: 'lmdcn-3',
    name: 'Tajine de Boeuf aux legumes du potager',
    description: 'Paleron de boeuf mijoté avec les legumes du jardins et des parfums d\'epices',
    category: 'Les Mets de chez Nous',
    price: 2600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'beef tagine',
    prepTime: 60,
    difficulty: 3,
    status: 'Actif',
    tags: ['Spécialité locale', 'Principal'],
    procedure: {
      preparation: [
        'Faire mijoter longuement le boeuf en morceaux avec les légumes et un mélange d\'épices (ras el hanout, curcuma...).'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  {
    id: 'lmdcn-4',
    name: 'Tajine de Kafta aux oeufs fondants',
    description: 'Boulette de boeuf mijotée, parfumée à la coriande avec ouefs coulant',
    category: 'Les Mets de chez Nous',
    price: 2300,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'kefta tagine',
    prepTime: 45,
    difficulty: 3,
    status: 'Actif',
    tags: ['Spécialité locale', 'Principal'],
    procedure: {
      preparation: [
        'Former des boulettes de viande hachée (kefta) assaisonnées.',
        'Les faire mijoter dans une sauce tomate.'
      ],
      cuisson: [
        'Casser les oeufs sur le dessus et laisser cuire.'
      ],
      service: []
    },
    allergens: ['Oeuf']
  },
  {
    id: 'lmdcn-5',
    name: 'Tajine de Poulet au citron et olives',
    description: 'Poulet mijoté, parfumé au citron et gingembre',
    category: 'Les Mets de chez Nous',
    price: 2200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken tagine',
    prepTime: 50,
    difficulty: 3,
    status: 'Actif',
    tags: ['Spécialité locale', 'Principal'],
    procedure: {
      preparation: [
        'Faire mijoter le poulet avec du citron confit, des olives, du gingembre et des épices.'
      ],
      cuisson: [],
      service: []
    },
    allergens: []
  },
  // --- Symphonie de Pâtes ---
  {
    id: 'sp-1',
    name: 'Arrabiata en Fièvre Rouge',
    description: 'Penne au coulis de tomate épicée, parfum de parmesan affiné',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 1400,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'penne arrabbiata',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Épicé', 'Italien', 'Pâtes', 'Vegan'],
    procedure: {
      preparation: [
        'Préparer une sauce tomate relevée avec de l\'ail et du piment.'
      ],
      cuisson: [
        'Cuire les penne al dente et les mélanger à la sauce.'
      ],
      service: [
        'Saupoudrer de parmesan.'
      ]
    },
    allergens: ['Gluten', 'Lactose']
  },
  {
    id: 'sp-2',
    name: 'Carbonara d’Antan au Poulet Fumé',
    description: 'Spaghetti enrubannés de crème et de beurre, jaune d’œuf, éclats de parmesan',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 1600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'spaghetti carbonara',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Italien', 'Pâtes'],
    procedure: {
      preparation: [
        'Faire revenir le poulet fumé.',
        'Cuire les spaghetti.',
        'Mélanger le jaune d\'oeuf avec la crème et le parmesan.',
        'Hors du feu, mélanger le tout.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  {
    id: 'sp-3',
    name: 'Fantaisie de Quatre Fromages',
    description: 'Tagliatelles fondantes au cheddar, gruyère, roquefort et parmesan',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 1600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'four cheese pasta',
    prepTime: 20,
    difficulty: 2,
    status: 'Actif',
    tags: ['Végétarien', 'Italien', 'Pâtes', 'Vegan'],
    procedure: {
      preparation: [
        'Faire fondre les quatre fromages dans de la crème liquide.'
      ],
      cuisson: [],
      service: [
        'Napper les tagliatelles cuites avec cette sauce onctueuse.'
      ]
    },
    allergens: ['Gluten', 'Lactose']
  },
  {
    id: 'sp-4',
    name: 'Bolognaise Rustica',
    description: 'Spaghetti nappés de sauce tomate maison et viande hachée mijotée',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 1700,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'spaghetti bolognese',
    prepTime: 25,
    difficulty: 2,
    status: 'Actif',
    tags: ['Italien', 'Pâtes'],
    procedure: {
      preparation: [
        'Préparer une sauce bolognaise en faisant mijoter la viande hachée avec une sauce tomate maison.'
      ],
      cuisson: [],
      service: [
        'Servir sur les spaghetti.'
      ]
    },
    allergens: ['Gluten']
  },
  {
    id: 'sp-5',
    name: 'Volupté de Poulet au Soleil Indien',
    description: 'Penne au poulet et poivrons, crème parfumée au curry',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 1800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'chicken curry pasta',
    prepTime: 25,
    difficulty: 2,
    status: 'Actif',
    tags: ['Italien', 'Pâtes'],
    procedure: {
      preparation: [
        'Faire une sauce crémeuse au curry avec des morceaux de poulet et des poivrons.',
        'Mélanger avec les penne cuites.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose']
  },
  {
    id: 'sp-6',
    name: 'Alfredo Impérial',
    description: 'Tagliatelles onctueuses aux champignons frais et filet de poulet tendre',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 1900,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'tagliatelle alfredo',
    prepTime: 25,
    difficulty: 2,
    status: 'Actif',
    tags: ['Italien', 'Pâtes'],
    procedure: {
      preparation: [
        'Préparer une sauce Alfredo (crème, beurre, parmesan).',
        'Ajouter le poulet grillé et les champignons sautés.',
        'Mélanger avec les tagliatelles.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose']
  },
  {
    id: 'sp-7',
    name: 'Écume Boréale au Saumon',
    description: 'Tagliatelles fondantes, saumon fumé, crème légère au parmesan',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 2200,
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
  {
    id: 'sp-8',
    name: 'Océane d\'Or aux Linguines',
    description: 'Fruits de mer, sauce tomate, éclats de parmesan',
    category: 'Symphonie de Pâtes – Évasion Italienne',
    price: 2500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'seafood linguine',
    prepTime: 25,
    difficulty: 3,
    status: 'Actif',
    tags: ['Italien', 'Pâtes', 'Crustacés', 'Mollusques'],
    procedure: {
      preparation: [
        'Préparer une sauce tomate avec un assortiment de fruits de mer.'
      ],
      cuisson: [],
      service: [
        'Servir avec les linguines et saupoudrer de parmesan.'
      ]
    },
    allergens: ['Gluten', 'Lactose', 'Crustacés', 'Mollusques']
  },
  // --- Burgers ---
  {
    id: 'burg-1',
    name: 'Burger Gourmet de boeuf',
    description: 'Patty de boeuf haché de 180 gr, pain brioche maison, tomate et laitue romane.',
    category: 'Nos Burgers Bistronomiques',
    price: 1800,
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
  {
    id: 'burg-2',
    name: 'Burger Le Forestier',
    description: 'Patty de boeuf haché de 150 gr, pain brioche maison, poêlée de champignons sauvages, comté affiné 18 mois, oignons confits au balsamique.',
    category: 'Nos Burgers Bistronomiques',
    price: 2000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'mushroom burger',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Burger', 'Américain'],
    procedure: {
      preparation: [
        'Cuire le steak.',
        'Garnir avec une poêlée de champignons sauvages, du comté fondu et des oignons confits.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose']
  },
  {
    id: 'burg-3',
    name: 'Burger Le Fumé de Bois',
    description: 'Patty de boeuf haché de 180 gr, pain brioche maison, tranche de bacon artisanale, sauce barbecue.',
    category: 'Nos Burgers Bistronomiques',
    price: 2100,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'bacon burger',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Burger', 'Américain'],
    procedure: {
      preparation: [
        'Cuire le steak.',
        'Ajouter du bacon grillé, du cheddar fondu et une sauce barbecue fumée.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose']
  },
  // --- Desserts ---
  {
    id: 'des-1',
    name: 'Tentation Chocolat Intense',
    description: 'Fondant cœur coulant, servi tiède avec son voile de crème anglaise',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant',
    price: 1400,
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
  {
    id: 'des-2',
    name: 'Crème Brûlée à la Vanille de Madagascar',
    description: 'Dentelle caramélisée, éclats d\'or sur douceur vanillée',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant',
    price: 1300,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'creme brulee',
    prepTime: 10,
    difficulty: 2,
    status: 'Actif',
    tags: ['Dessert', 'Sucré'],
    procedure: {
      preparation: [
        'Préparer l\'appareil à crème brûlée.',
        'Le verser dans des ramequins et cuire au bain-marie.',
        'Laisser refroidir, puis caraméliser le dessus au chalumeau avant de servir.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Lactose', 'Oeuf']
  },
  {
    id: 'des-3',
    name: 'Cheesecake Nuage de Citron',
    description: 'Base croquante, mousse légère au citron et zeste confit',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant',
    price: 1500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'lemon cheesecake',
    prepTime: 15,
    difficulty: 3,
    status: 'Actif',
    tags: ['Dessert', 'Sucré'],
    procedure: {
      preparation: [
        'Préparer la base biscuitée.',
        'Préparer la garniture au fromage frais et citron.',
        'Verser sur la base et laisser prendre au frais plusieurs heures.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  {
    id: 'des-4',
    name: 'Tiramisu Doux Péché',
    description: 'Velours de mascarpone au café et biscuit savoyard imbibé',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant',
    price: 1500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'tiramisu classic',
    prepTime: 15,
    difficulty: 3,
    status: 'Actif',
    tags: ['Dessert', 'Sucré'],
    procedure: {
      preparation: [
        'Préparer la crème au mascarpone.',
        'Imbiber les biscuits dans du café froid.',
        'Monter le tiramisu en alternant les couches.',
        'Laisser reposer au frais.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Lactose', 'Oeuf']
  },
  {
    id: 'des-5',
    name: 'Pavlova des Rêves Rouges',
    description: 'Meringue craquante, chantilly vanillée, fruits rouges frais',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant',
    price: 1600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'pavlova berries',
    prepTime: 20,
    difficulty: 3,
    status: 'Actif',
    tags: ['Dessert', 'Sucré'],
    procedure: {
      preparation: [
        'Préparer et cuire la meringue.',
        'Monter une crème chantilly.',
        'Garnir la meringue de chantilly et de fruits rouges frais juste avant de servir.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Lactose', 'Oeuf']
  },
  {
    id: 'des-6',
    name: 'Délice Oriental au Miel & Amandes',
    description: 'Pâtisseries fines d\'inspiration maghrébine revisitées',
    category: 'Douceurs Signature – Éclats Sucrés de l’Instant',
    price: 1300,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'oriental pastry',
    prepTime: 10,
    difficulty: 2,
    status: 'Actif',
    tags: ['Spécialité locale', 'Dessert', 'Sucré'],
    procedure: {
      preparation: [
        'Assortiment de pâtisseries orientales maison, comme des cigares aux amandes ou des makrouts.'
      ],
      cuisson: [],
      service: []
    },
    allergens: ['Gluten', 'Noix']
  },
  // --- Boissons ---
  {
    id: 'boi-1',
    name: 'Expresso Signature',
    description: 'Un café intense et court, parfait pour une pause rapide.',
    category: 'Élixirs & Rafraîchissements',
    price: 600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'espresso coffee',
    prepTime: 2,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-2',
    name: 'Cappuccino Mousse de Lait',
    description: 'Café expresso couronné d\'une mousse de lait onctueuse.',
    category: 'Élixirs & Rafraîchissements',
    price: 800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'cappuccino art',
    prepTime: 5,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: ['Lactose']
  },
  {
    id: 'boi-3',
    name: 'Café Latte Douceur Vanille',
    description: 'Douce alliance d\'expresso, de lait chaud et d\'une touche de vanille.',
    category: 'Élixirs & Rafraîchissements',
    price: 1000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'latte vanilla',
    prepTime: 5,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: ['Lactose']
  },
  {
    id: 'boi-4',
    name: 'Thé Vert ou Noir Infusé Minute',
    description: 'Infusion délicate de thé vert ou noir, rafraîchissante et pleine de bienfaits.',
    category: 'Élixirs & Rafraîchissements',
    price: 600,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'tea cup',
    prepTime: 5,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-5',
    name: 'Thé aux Épices Signature (cannelle, gingembre, orange)',
    description: 'Thé noir infusé avec des notes chaleureuses de cannelle, gingembre et orange.',
    category: 'Élixirs & Rafraîchissements',
    price: 800,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'spiced tea',
    prepTime: 5,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-6',
    name: 'Cocktail Signature Sans Alcool',
    description: 'Mélange de fruits frais, touche florale',
    category: 'Élixirs & Rafraîchissements',
    price: 1200,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'fruit mocktail',
    prepTime: 5,
    difficulty: 2,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-7',
    name: 'Citronnade Maison à la Menthe',
    description: 'Rafraîchissante citronnade maison préparée avec de la menthe fraîche.',
    category: 'Élixirs & Rafraîchissements',
    price: 1000,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'lemonade mint',
    prepTime: 5,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-8',
    name: 'Smoothie Mangue Passion',
    description: 'Un smoothie exotique et onctueux à la mangue et au fruit de la passion.',
    category: 'Élixirs & Rafraîchissements',
    price: 1500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'mango smoothie',
    prepTime: 5,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-9',
    name: 'Eau minérale / gazeuse',
    description: 'Eau minérale naturelle ou gazeuse, pour s\'hydrater en toute simplicité.',
    category: 'Élixirs & Rafraîchissements',
    price: 500,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'water bottle',
    prepTime: 1,
    difficulty: 1,
    status: 'Actif',
    tags: ['Boisson'],
    procedure: { preparation: [], cuisson: [], service: [] },
    allergens: []
  },
  {
    id: 'boi-10',
    name: 'Sodas classiques',
    description: 'Vos sodas préférés pour une pause pétillante.',
    category: 'Élixirs & Rafraîchissements',
    price: 700,
    image: 'https://placehold.co/600x400.png',
    imageHint: 'soda can',
    prepTime: 1,
    difficulty: 1,
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
    { id: 'ri-ef2-3', recipeId: 'ef-2', ingredientId: 'ing-3', quantity: 30, unitUse: 'g' },
    { id: 'ri-ef3-1', recipeId: 'ef-3', ingredientId: 'ing-6', quantity: 100, unitUse: 'g' },
    { id: 'ri-ef3-2', recipeId: 'ef-3', ingredientId: 'ing-4', quantity: 150, unitUse: 'g' },
    { id: 'ri-ef3-3', recipeId: 'ef-3', ingredientId: 'ing-5', quantity: 30, unitUse: 'g' },
    { id: 'ri-ef4-1', recipeId: 'ef-4', ingredientId: 'ing-7', quantity: 100, unitUse: 'g' },
    { id: 'ri-ef4-2', recipeId: 'ef-4', ingredientId: 'ing-6', quantity: 50, unitUse: 'g' },
    { id: 'ri-ef7-1', recipeId: 'ef-7', ingredientId: 'ing-8', quantity: 100, unitUse: 'g' },
    { id: 'ri-ef7-2', recipeId: 'ef-7', ingredientId: 'ing-7', quantity: 50, unitUse: 'g' },
    { id: 'ri-ef9-1', recipeId: 'ef-9', ingredientId: 'ing-4', quantity: 100, unitUse: 'g' },
    { id: 'ri-ef9-2', recipeId: 'ef-9', ingredientId: 'ing-5', quantity: 30, unitUse: 'g' },
    { id: 'ri-ef9-3', recipeId: 'ef-9', ingredientId: 'ing-6', quantity: 50, unitUse: 'g' },
    { id: 'ri-ef10-1', recipeId: 'ef-10', ingredientId: 'ing-8', quantity: 80, unitUse: 'g' },
    { id: 'ri-ef11-1', recipeId: 'ef-11', ingredientId: 'ing-4', quantity: 150, unitUse: 'g' },
    { id: 'ri-ef12-1', recipeId: 'ef-12', ingredientId: 'ing-1', quantity: 50, unitUse: 'g' },
    { id: 'ri-ef12-2', recipeId: 'ef-12', ingredientId: 'ing-2', quantity: 50, unitUse: 'g' },
    { id: 'ri-ef14-1', recipeId: 'ef-14', ingredientId: 'ing-7', quantity: 50, unitUse: 'g' },
    { id: 'ri-ef15-1', recipeId: 'ef-15', ingredientId: 'ing-1', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-pg1-1', recipeId: 'pg-1', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg2-1', recipeId: 'pg-2', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg3-1', recipeId: 'pg-3', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg3-2', recipeId: 'pg-3', ingredientId: 'ing-12', quantity: 100, unitUse: 'ml' },
    { id: 'ri-pg3-3', recipeId: 'pg-3', ingredientId: 'ing-10', quantity: 10, unitUse: 'g' },
    { id: 'ri-pg4-1', recipeId: 'pg-4', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg4-2', recipeId: 'pg-4', ingredientId: 'ing-14', quantity: 50, unitUse: 'g' },
    { id: 'ri-pg5-1', recipeId: 'pg-5', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg5-2', recipeId: 'pg-5', ingredientId: 'ing-10', quantity: 5, unitUse: 'g' },
    { id: 'ri-pg7-1', recipeId: 'pg-7', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg7-2', recipeId: 'pg-7', ingredientId: 'ing-12', quantity: 50, unitUse: 'ml' },
    { id: 'ri-pg8-1', recipeId: 'pg-8', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg8-2', recipeId: 'pg-8', ingredientId: 'ing-12', quantity: 50, unitUse: 'ml' },
    { id: 'ri-pg9-1', recipeId: 'pg-9', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg9-2', recipeId: 'pg-9', ingredientId: 'ing-5', quantity: 30, unitUse: 'g' },
    { id: 'ri-pg9-3', recipeId: 'pg-9', ingredientId: 'ing-1', quantity: 50, unitUse: 'g' },
    { id: 'ri-pg10-1', recipeId: 'pg-10', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg11-1', recipeId: 'pg-11', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg12-1', recipeId: 'pg-12', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg13-1', recipeId: 'pg-13', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg13-2', recipeId: 'pg-13', ingredientId: 'ing-10', quantity: 5, unitUse: 'g' },
    { id: 'ri-pg14-1', recipeId: 'pg-14', ingredientId: 'ing-4', quantity: 250, unitUse: 'g' },
    { id: 'ri-pg16-1', recipeId: 'pg-16', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-pg18-1', recipeId: 'pg-18', ingredientId: 'ing-4', quantity: 150, unitUse: 'g' },
    { id: 'ri-lmdcn-2-1', recipeId: 'lmdcn-2', ingredientId: 'ing-9', quantity: 200, unitUse: 'g' },
    { id: 'ri-lmdcn-2-2', recipeId: 'lmdcn-2', ingredientId: 'ing-4', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-lmdcn-3-1', recipeId: 'lmdcn-3', ingredientId: 'ing-4', quantity: 250, unitUse: 'g' },
    { id: 'ri-lmdcn-4-1', recipeId: 'lmdcn-4', ingredientId: 'ing-4', quantity: 200, unitUse: 'g' },
    { id: 'ri-lmdcn-4-2', recipeId: 'lmdcn-4', ingredientId: 'ing-13', quantity: 2, unitUse: 'pièce' },
    { id: 'ri-lmdcn-5-1', recipeId: 'lmdcn-5', ingredientId: 'ing-4', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-sp1-1', recipeId: 'sp-1', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp1-2', recipeId: 'sp-1', ingredientId: 'ing-1', quantity: 200, unitUse: 'g' },
    { id: 'ri-sp1-3', recipeId: 'sp-1', ingredientId: 'ing-10', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-sp2-1', recipeId: 'sp-2', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp2-2', recipeId: 'sp-2', ingredientId: 'ing-4', quantity: 100, unitUse: 'g' },
    { id: 'ri-sp2-3', recipeId: 'sp-2', ingredientId: 'ing-13', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-sp3-1', recipeId: 'sp-3', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp4-1', recipeId: 'sp-4', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp4-2', recipeId: 'sp-4', ingredientId: 'ing-4', quantity: 100, unitUse: 'g' },
    { id: 'ri-sp4-3', recipeId: 'sp-4', ingredientId: 'ing-1', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp5-1', recipeId: 'sp-5', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp5-2', recipeId: 'sp-5', ingredientId: 'ing-4', quantity: 100, unitUse: 'g' },
    { id: 'ri-sp6-1', recipeId: 'sp-6', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp6-2', recipeId: 'sp-6', ingredientId: 'ing-4', quantity: 100, unitUse: 'g' },
    { id: 'ri-sp7-1', recipeId: 'sp-7', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp7-2', recipeId: 'sp-7', ingredientId: 'ing-7', quantity: 100, unitUse: 'g' },
    { id: 'ri-sp7-3', recipeId: 'sp-7', ingredientId: 'ing-12', quantity: 50, unitUse: 'ml' },
    { id: 'ri-sp8-1', recipeId: 'sp-8', ingredientId: 'ing-9', quantity: 150, unitUse: 'g' },
    { id: 'ri-sp8-2', recipeId: 'sp-8', ingredientId: 'ing-8', quantity: 80, unitUse: 'g' },
    { id: 'ri-burg1-1', recipeId: 'burg-1', ingredientId: 'ing-4', quantity: 180, unitUse: 'g' },
    { id: 'ri-burg1-2', recipeId: 'burg-1', ingredientId: 'ing-1', quantity: 1, unitUse: 'tranche' },
    { id: 'ri-burg2-1', recipeId: 'burg-2', ingredientId: 'ing-4', quantity: 150, unitUse: 'g' },
    { id: 'ri-burg3-1', recipeId: 'burg-3', ingredientId: 'ing-4', quantity: 180, unitUse: 'g' },
    { id: 'ri-des1-1', recipeId: 'des-1', ingredientId: 'ing-11', quantity: 70, unitUse: 'g' },
    { id: 'ri-des1-2', recipeId: 'des-1', ingredientId: 'ing-13', quantity: 1, unitUse: 'pièce' },
    { id: 'ri-des2-1', recipeId: 'des-2', ingredientId: 'ing-12', quantity: 100, unitUse: 'ml' },
    { id: 'ri-des2-2', recipeId: 'des-2', ingredientId: 'ing-13', quantity: 2, unitUse: 'pièce' },
    { id: 'ri-des3-1', recipeId: 'des-3', ingredientId: 'ing-13', quantity: 0.5, unitUse: 'pièce' },
    { id: 'ri-des4-1', recipeId: 'des-4', ingredientId: 'ing-13', quantity: 4, unitUse: 'pièce' },
    { id: 'ri-des5-1', recipeId: 'des-5', ingredientId: 'ing-13', quantity: 2, unitUse: 'pièce' },
    { id: 'ri-des5-2', recipeId: 'des-5', ingredientId: 'ing-15', quantity: 100, unitUse: 'g' },
    { id: 'ri-des6-1', recipeId: 'des-6', ingredientId: 'ing-15', quantity: 2, unitUse: 'pièce' },
];

    