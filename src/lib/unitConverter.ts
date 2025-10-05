
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
  if (eq[key]) {
    const factor = parseFloat(eq[key] as any); // Assurer la conversion en nombre
    if (!isNaN(factor)) return factor;
  }

  // On essaie aussi dans l'autre sens (ex: g -> pièce si pièce -> g est défini)
  const reverseKey = `${t}->${f}`;
  if (eq[reverseKey]) {
    const factor = parseFloat(eq[reverseKey] as any);
    if (!isNaN(factor) && factor !== 0) return 1 / factor;
  }
  
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
 * @returns Le coût calculé et une erreur potentielle.
 */
export function computeIngredientCost(
  ingredient: Ingredient,
  usedQuantity: number,
  usedUnit: string
): { cost: number; error?: string } {
  // Sécurités
  if (ingredient.purchasePrice == null) {
    return { cost: 0, error: "Le prix d'achat est manquant." };
  }
  if (usedQuantity <= 0) return { cost: 0 };
  
  // Cas prioritaire : l'unité utilisée est la même que l'unité d'achat
  if (usedUnit.toLowerCase() === ingredient.purchaseUnit.toLowerCase()) {
    const costPerPurchaseUnit = ingredient.purchasePrice; // Le prix est pour UNE unité d'achat
    const finalCost = costPerPurchaseUnit * usedQuantity;
    return { cost: finalCost };
  }

  // Si les unités sont différentes, on passe par la conversion via l'unité de base
  if (ingredient.purchaseWeightGrams == null) {
    return { cost: 0, error: "Le poids de l'unité d'achat est requis pour la conversion." };
  }

  // *** LOGIQUE DE CALCUL CORRIGÉE ***

  // 1. Calculer le coût PAR GRAMME (ou ml) NET.
  // On divise le prix de l'unité d'achat par le nombre de grammes qu'elle contient.
  const costPerGramRaw = ingredient.purchasePrice / ingredient.purchaseWeightGrams;
  const costPerGramNet = costPerGramRaw / ((ingredient.yieldPercentage || 100) / 100);

  // 2. Convertir la quantité demandée en unité de base (grammes).
  // La logique assume ici que l'unité de base pour le calcul de coût est le gramme.
  const baseUnitForCost = 'g';
  const conversionFactor = getConversionFactor(usedUnit, baseUnitForCost, ingredient);
  
  if (conversionFactor === 1 && usedUnit.toLowerCase() !== baseUnitForCost.toLowerCase()) {
     const hasDirectEquivalence = ingredient.equivalences && Object.keys(ingredient.equivalences).some(k => k.startsWith(usedUnit.toLowerCase()));
     if(!hasDirectEquivalence && !standardConversions[usedUnit.toLowerCase()]) {
        return { cost: 0, error: `Conversion impossible de '${usedUnit}' à '${baseUnitForCost}'. Veuillez définir une équivalence dans la fiche ingrédient.` };
     }
  }

  const quantityInGrams = usedQuantity * conversionFactor;
  
  // 3. Calcul final
  const finalCost = quantityInGrams * costPerGramNet;

  if (isNaN(finalCost)) {
    return { cost: 0, error: "Le résultat du calcul est invalide (NaN)." };
  }

  return { cost: finalCost };
}
