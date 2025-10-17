
'use server';
/**
 * @fileOverview Flow Genkit pour l'analyse stratégique du menu.
 * - runMenuAnalysis: Reçoit les données d'analyse et demande des recommandations à l'IA.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Schémas Zod pour valider les entrées du flow.
const SummaryDataSchema = z.object({
    totalDishes: z.number(),
    averageDuration: z.number(),
    categoryCount: z.record(z.number()),
});

const ProductionDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    duration: z.number(),
    duration_breakdown: z.object({
        mise_en_place: z.number(),
        cuisson: z.number(),
        envoi: z.number(),
    }),
    foodCost: z.number(),
    grossMargin: z.number(),
    yieldPerMin: z.number(),
    price: z.number(),
    mode_preparation: z.enum(['avance', 'minute', 'mixte']).optional(),
});

const MutualisationDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    dishCount: z.number(),
    dishes: z.array(z.string()),
    frequency: z.string(),
});

const AnalysisInputSchema = z.object({
    summary: SummaryDataSchema.describe("Résumé général du menu."),
    production: z.array(ProductionDataSchema).describe("Données de production et de rentabilité pour chaque plat."),
    mutualisations: z.array(MutualisationDataSchema).describe("Liste des préparations communes à plusieurs plats."),
});
export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;


// --- NOUVEAUX SCHÉMAS DE SORTIE ---
const DishAnalysisSchema = z.object({
  id: z.string().describe("L'ID du plat analysé."),
  name: z.string().describe("Le nom du plat analysé."),
  priority: z.enum(['Urgent', 'Moyen', 'Bon']).describe("La priorité d'intervention sur ce plat (Urgent, Moyen, Bon)."),
  suggestion: z.string().describe("La recommandation spécifique pour ce plat (ex: 'Ajuster recette/prix', 'Passer en cuisson sous-vide')."),
  impact: z.string().describe("L'impact attendu de la suggestion (ex: 'Gain de marge', 'Réduction du temps de service').")
});
export type DishAnalysis = z.infer<typeof DishAnalysisSchema>;

const PlanningTaskSchema = z.object({
  heure: z.string().describe("L'heure de début de la tâche (ex: '08:00')."),
  poste: z.string().describe("Le poste de cuisine assigné (ex: 'Chaud', 'Garde-manger', 'Pâtisserie')."),
  tache: z.string().describe("La description de la tâche à effectuer."),
  duree: z.number().describe("La durée estimée en minutes."),
  priorite: z.number().describe("Le niveau de priorité (1=Haute, 2=Moyenne, 3=Basse).")
});
export type PlanningTask = z.infer<typeof PlanningTaskSchema>;


// Schéma de la sortie attendue de l'IA
const AIOutputSchema = z.object({
    strategic_recommendations: z.string().describe("Les recommandations stratégiques globales au format Markdown (gestion des postes, flux de production, mutualisation)."),
    dish_reengineering: z.array(DishAnalysisSchema).describe("La liste des plats identifiés pour une réingénierie, classés par priorité."),
    production_planning_suggestions: z.array(PlanningTaskSchema).describe("Le planning de production horaire suggéré, optimisé selon l'analyse.")
});
export type AIResults = z.infer<typeof AIOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'menuAnalysisPrompt',
    input: { schema: z.object({ jsonData: z.string() }) },
    output: { schema: AIOutputSchema },
    model: googleAI.model('gemini-2.5-flash'),
    config: {
        temperature: 0.2,
    },
    prompt: `SYSTEM: Tu es un consultant expert en performance de restaurants. Ta mission est d'analyser en profondeur le JSON fourni et de générer un rapport d'optimisation structuré.

DONNÉES DU MENU À ANALYSER :
\`\`\`json
{{{jsonData}}}
\`\`\`

CONTEXTE MÉTIER :
- "duration": Représente la charge de travail *pendant le service*. Une durée élevée ici est un point de friction.
- "grossMargin": La marge brute par portion. Une marge faible est un problème.
- "yieldPerMin": Le rendement financier à la minute. C'est un KPI crucial.

INSTRUCTIONS IMPÉRATIVES DE SORTIE :
Tu DOIS retourner un objet JSON avec EXACTEMENT trois clés : "strategic_recommendations", "dish_reengineering", et "production_planning_suggestions".

1.  **Pour "dish_reengineering"**:
    - Analyse chaque plat dans la section "production" des données.
    - Classifie CHAQUE plat selon la priorité d'intervention suivante :
        - 🔴 'Urgent': Marge brute faible ET/OU rendement (yieldPerMin) très bas. Ce sont tes cibles prioritaires.
        - 🟠 'Moyen': Potentiel d'optimisation (ex: marge correcte mais durée longue, ou rapide mais marge faible).
        - 🟢 'Bon': Plats rentables et rapides. Ce sont tes étoiles, il faut les protéger.
    - Pour chaque plat classé 'Urgent' ou 'Moyen', fournis une "suggestion" d'action claire et concise (ex: "Simplifier la garniture", "Augmenter le prix de 15%", "Passer la cuisson de la protéine en mode 'mixte'").
    - Remplis le champ "impact" avec le bénéfice attendu (ex: "Réduction du temps de service de 10 min", "Augmentation de la marge de 250 DZD").

2.  **Pour "strategic_recommendations"**:
    - Fournis 2-3 recommandations de HAUT NIVEAU basées sur les données.
    - Adresse les goulots d'étranglement potentiels (ex: trop de plats sur le poste 'Chaud').
    - Commente les opportunités de "mutualisations" : si une préparation est très utilisée, recommande sa production en grande quantité.

3.  **Pour "production_planning_suggestions"**:
    - Génère un planning de production logique pour la mise en place, en te basant sur les durées et les mutualisations.
    - Place les tâches longues et "avance" en début de journée (08:00 - 11:00).

Ne te base que sur les données du JSON. Sois précis et orienté action.
`,
});


const menuAnalysisFlow = ai.defineFlow(
    {
        name: 'menuAnalysisFlow',
        inputSchema: AnalysisInputSchema,
        outputSchema: AIOutputSchema,
    },
    async (input) => {
        const { output } = await analysisPrompt({ jsonData: JSON.stringify(input) });
         if (!output) {
            throw new Error("L'IA n'a pas pu générer une réponse valide.");
        }
        return output;
    }
);

// Wrapper asynchrone pour l'exportation
export async function runMenuAnalysis(input: AnalysisInput): Promise<AIResults> {
    return menuAnalysisFlow(input);
}
