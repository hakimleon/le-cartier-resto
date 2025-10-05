// src/lib/unitConverter.ts
import type { Ingredient } from './types';

// --- TABLE DE CONVERSIONS STANDARD ---
// Sert de fallback pour les conversions simples (poids/poids, volume/volume).
const standardConversions: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  l: 1000,
  ml: 1,
  cl: 10,
  pièce: 1, // Utilisé pour les conversions pièce->pièce
  unité: 1,
  botte: 1,
};

/**
 * Détermine le facteur de conversion entre deux unités.
 * @param fromUnit L'unité de départ (ex: "pièce").
 * @param toUnit L'unité de destination (ex: "g").
 * @param ingredient L'ingrédient concerné, pour ses équivalences spécifiques.
 * @returns Le facteur par lequel multiplier la quantité.
 */
export function getConversionFactor(
  fromUnit: string,
  toUnit: string,
  ingredient?: Partial<Ingredient>
): number {
  if (!fromUnit || !toUnit) return 1;

  const f = fromUnit.toLowerCase();
  const t = toUnit.toLowerCase();

  // Cas 1 — Même unité, le facteur est 1.
  if (f === t) return 1;

  // Cas 2 — Conversion spécifique à l’ingrédient via la table d'équivalences.
  // C'est la conversion la plus prioritaire.
  const eq = ingredient?.equivalences || {};
  const key = `${f}->${t}`;
  if (eq[key]) return eq[key];

  // On essaie aussi dans l'autre sens (ex: g -> pièce si pièce -> g est défini)
  const reverseKey = `${t}->${f}`;
  if (eq[reverseKey] && eq[reverseKey] !== 0) return 1 / eq[reverseKey];
  
  // Cas 3 — Conversion standard (poids/poids, volume/volume)
  if (standardConversions[f] && standardConversions[t]) {
    const weightUnits = ["g", "kg", "mg"];
    const volumeUnits = ["ml", "l", "cl"];

    const bothWeight = weightUnits.includes(f) && weightUnits.includes(t);
    const bothVolume = volumeUnits.includes(f) && volumeUnits.includes(t);

    if (bothWeight || bothVolume) {
      return standardConversions[f] / standardConversions[t];
    }
  }

  // Cas 4 — Conversion impossible, on avertit et on retourne 1 pour ne pas casser le calcul.
  console.warn(`[CONVERSION] Conversion impossible entre '${fromUnit}' et '${toUnit}' pour l'ingrédient '${ingredient?.name}'. Facteur par défaut : 1.`);
  return 1;
}

/**
 * Calcule le coût réel d'un ingrédient utilisé dans une recette.
 * @param ingredient La fiche complète de l'ingrédient.
 * @param usedQuantity La quantité utilisée dans la recette.
 * @param usedUnit L'unité de cette quantité (ex: "pièce", "g", "ml").
 * @returns Le coût calculé.
 */
export function computeIngredientCost(
  ingredient: Ingredient,
  usedQuantity: number,
  usedUnit: string
): { cost: number; error?: string } {
  // Sécurités
  if (!ingredient.purchasePrice || !ingredient.purchaseWeightGrams) {
    return { cost: 0, error: "Données d'achat incomplètes." };
  }
  if (usedQuantity <= 0) return { cost: 0 };
  
  const baseUnit = ingredient.baseUnit || 'g';

  // 1. Coût par unité de base (g ou ml), tenant compte du rendement
  const costPerBaseUnitRaw = ingredient.purchasePrice / ingredient.purchaseWeightGrams;
  const costPerBaseUnitNet = costPerBaseUnitRaw / ((ingredient.yieldPercentage || 100) / 100);

  // 2. Convertir la quantité utilisée vers l'unité de base
  const conversionFactor = getConversionFactor(usedUnit, baseUnit, ingredient);
  if (conversionFactor === 1 && usedUnit.toLowerCase() !== baseUnit.toLowerCase()) {
     const hasDirectEquivalence = ingredient.equivalences && Object.keys(ingredient.equivalences).some(k => k.startsWith(usedUnit.toLowerCase()));
     if(!hasDirectEquivalence && !standardConversions[usedUnit.toLowerCase()]) {
        return { cost: 0, error: `Conversion impossible de '${usedUnit}' à '${baseUnit}'. Veuillez définir une équivalence.` };
     }
  }

  const quantityInBaseUnit = usedQuantity * conversionFactor;
  
  // 3. Calcul final
  const finalCost = quantityInBaseUnit * costPerBaseUnitNet;

  return { cost: finalCost };
}
