'use server';

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe } from '@/lib/types';

/**
 * @api {get} /api/active-dishes Get Active Dishes
 * @apiName GetActiveDishes
 * @apiGroup Dishes
 *
 * @apiSuccess {Object[]} dishes List of active dishes.
 * @apiSuccess {String} dishes.id The dish ID.
 * @apiSuccess {String} dishes.name The name of the dish.
 * @apiSuccess {String} dishes.description The description of the dish.
 * @apiSuccess {String} dishes.category The category of the dish.
 * @apiSuccess {Number} dishes.price The price of the dish.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": "zyx987",
 *         "name": "Filet de Boeuf",
 *         "description": "...",
 *         "category": "Plats et Grillades",
 *         "price": 3200
 *       }
 *     ]
 */
export async function GET(req: NextRequest) {
  try {
    const recipesQuery = query(
      collection(db, 'recipes'),
      where('type', '==', 'Plat'),
      where('status', '==', 'Actif')
    );

    const querySnapshot = await getDocs(recipesQuery);
    const activeDishes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Omitting the requested fields
      const { commercialArgument, imageUrl, ...rest } = data;
      return {
        id: doc.id,
        ...rest,
      };
    }) as Omit<Recipe, 'commercialArgument' | 'imageUrl'>[];

    return NextResponse.json(activeDishes);
  } catch (error) {
    console.error('Error fetching active dishes:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch active dishes', details: errorMessage },
      { status: 500 }
    );
  }
}
