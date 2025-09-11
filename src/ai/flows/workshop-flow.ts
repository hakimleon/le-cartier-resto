
'use server';
/**
 * @fileOverview DEPRECATED Flow pour l'atelier de création de plats.
 * La logique a été migrée vers `recipe-workshop-flow.ts` pour unifier la génération.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DishConceptInputSchema = z.object({});
export type DishConceptInput = z.infer<typeof DishConceptInputSchema>;

const DishConceptOutputSchema = z.object({});
export type DishConceptOutput = z.infer<typeof DishConceptOutputSchema>;


// This function is now deprecated and will not be used.
export async function generateDishConcept(input: DishConceptInput): Promise<DishConceptOutput> {
    console.warn("DEPRECATED: generateDishConcept from workshop-flow.ts is called. Use generateRecipeConcept from recipe-workshop-flow.ts instead.");
    throw new Error("This flow is deprecated.");
}
