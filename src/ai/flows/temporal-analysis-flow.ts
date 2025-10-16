
'use server';
/**
 * @fileOverview Un flux Genkit dédié à l'analyse de la temporalité d'une recette.
 * - analyzeTemporalContext: Détermine si une recette est 'avance', 'minute' ou 'mixte'.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const TemporalAnalysisInputSchema = z.object({
  name: z.string().describe("Le nom de la recette."),
  procedure: z.string().describe("La procédure de fabrication complète de la recette."),
});

const TemporalAnalysisOutputSchema = z.enum(['avance', 'minute', 'mixte']);

// Le prompt ne définit plus de schéma de sortie, on va analyser le texte brut.
const temporalAnalysisPrompt = ai.definePrompt({
  name: 'temporalAnalysisPrompt',
  input: { schema: TemporalAnalysisInputSchema },
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `Analyse la procédure de la recette suivante et détermine sa temporalité de production.
Ta réponse doit être UNIQUEMENT l'un des trois mots suivants : 'avance', 'minute', ou 'mixte'.

- 'avance': Si la recette peut être entièrement préparée bien avant le service (ex: un fond, une terrine, un gratin complet).
- 'minute': Si la majorité du travail se fait au moment de la commande (ex: un steak grillé, un poisson poêlé, une salade composée).
- 'mixte': Si une partie significative est faite en avance et une autre partie cruciale est faite à la minute (ex: une purée de base faite en avance mais montée au beurre au moment du service, une viande marquée en avance et réchauffée/finie à la commande).

Nom de la recette : {{{name}}}

Procédure à analyser :
---
{{{procedure}}}
---

Réponds seulement par 'avance', 'minute', ou 'mixte'. Pas de phrases, pas d'explications.
`,
});

export async function analyzeTemporalContext(
  input: z.infer<typeof TemporalAnalysisInputSchema>
): Promise<z.infer<typeof TemporalAnalysisOutputSchema>> {
  
  const response = await temporalAnalysisPrompt(input);
  const textResponse = response.text.toLowerCase().trim().replace(/['"`]/g, '');

  if (textResponse.includes('avance')) {
    return 'avance';
  }
  if (textResponse.includes('mixte')) {
    return 'mixte';
  }
  if (textResponse.includes('minute')) {
    return 'minute';
  }

  // Si aucun mot-clé n'est trouvé, cela lève une erreur plus claire.
  throw new Error(`L'IA a retourné une réponse inattendue et non-conforme: "${response.text}"`);
}
