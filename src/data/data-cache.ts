// src/data/data-cache.ts
import { Recipe } from './definitions';

export const initialRecipes: Recipe[] = [
    {
      id: 'ef-2',
      name: 'Caprice Méditerranéen',
      description: 'Duo de tomate et mozzarella aux herbes fraîches',
      category: 'Entrées Froides – Fraîcheur et Élégance',
      price: 1200,
      cost: 480,
      image: 'https://placehold.co/600x400.png',
      imageHint: 'caprese salad',
      prepTime: 10,
      difficulty: 1,
      status: 'Actif',
      tags: ['Végétarien'],
      portionSize: '1 assiette / 200g',
      calories: 250,
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
      allergens: ['Lactose'],
      notes: 'Privilégier une mozzarella de bufflonne et des tomates bien mûres pour un goût optimal.',
      argumentationCommerciale: "Je vous conseille ce grand classique de la cuisine méditerranéenne : l’alliance des tomates mûres, de la mozzarella fondante et du basilic frais, relevée d’une touche d’huile d’olive. C’est une entrée fraîche, légère et pleine de soleil."
    },
    {
      id: 'pg-16',
      name: 'Filet Majestueux des Prairies',
      description: 'Filet de bœuf grillé au jus réduit, purée truffée en option',
      price: 3200,
      cost: 1600,
      category: 'Plats et Grillades – Saveurs en Majesté',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'beef fillet',
      prepTime: 30,
      status: 'Actif',
      difficulty: 4,
      tags: [],
      procedure: {
          preparation: ["Proposer une purée maison à l'huile de truffe en accompagnement."],
          cuisson: ["Griller le filet de boeuf à la cuisson désirée."],
          service: ["Servir avec un jus de viande réduit."]
      },
      allergens: [],
    },
];
