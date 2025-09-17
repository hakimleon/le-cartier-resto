
'use server';
/**
 * @fileOverview Outils pour interagir avec les données de recettes.
 *
 * - getAllPreparationNames: Récupère les noms de toutes les préparations.
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';


/**
 * Récupère les noms de toutes les préparations disponibles.
 * @returns Une promesse qui se résout en un tableau de noms de préparations.
 */
export async function getAllPreparationNames(): Promise<string[]> {
    try {
        const preparationsSnapshot = await getDocs(collection(db, 'preparations'));
        const preparationNames = preparationsSnapshot.docs.map(doc => (doc.data() as Preparation).name);
        return preparationNames;
    } catch (error) {
        console.error("Error fetching all preparation names:", error);
        return [];
    }
}
