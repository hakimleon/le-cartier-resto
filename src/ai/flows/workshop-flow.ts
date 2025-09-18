
'use server';
/**
 * @fileOverview DEPRECATED Flow pour l'atelier de création de plats.
 * La logique a été migrée vers `recipe-workshop-flow.ts` pour unifier la génération.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateRecipeConcept as generateRecipeConceptFromNewFlow, RecipeConceptInput, RecipeConceptOutput } from './recipe-workshop-flow';


// This function is now deprecated but will temporarily forward calls to the new flow
// to ensure the old WorkshopClient doesn't break immediately.
// The client should be updated to call generateRecipeConcept from recipe-workshop-flow.ts directly.
export async function generateDishConcept(input: RecipeConceptInput): Promise<RecipeConceptOutput> {
    console.warn("DEPRECATED: generateDishConcept from workshop-flow.ts is called. Use generateRecipeConcept from recipe-workshop-flow.ts instead.");
    return generateRecipeConceptFromNewFlow({ ...input, type: 'Plat' });
}

    