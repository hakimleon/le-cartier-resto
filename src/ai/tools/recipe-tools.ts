'use server';
/**
 * @fileOverview Outils Genkit pour interagir avec les données de recettes.
 *
 * - getAvailablePreparationsTool: Un outil qui récupère et retourne les noms de toutes les fiches de préparation disponibles dans Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Preparation } from '@/lib/types';


export const getAvailablePreparationsTool = ai.defineTool(
    {
        name: 'getAvailablePreparations',
        description: 'Récupère la liste de toutes les fiches de préparation (sous-recettes) disponibles pour être utilisées dans la création de plats plus complexes. Doit être appelé pour savoir quelles préparations peuvent être utilisées.',
        outputSchema: z.array(z.string()),
    },
    async () => {
        try {
            const preparationsSnapshot = await getDocs(collection(db, 'preparations'));
            const preparations = preparationsSnapshot.docs.map(doc => (doc.data() as Preparation).name);
            return preparations;
        } catch (error) {
            console.error("Error fetching preparations from Firestore:", error);
            // En cas d'erreur, retourner une liste vide pour ne pas bloquer le flow.
            return [];
        }
    }
);
