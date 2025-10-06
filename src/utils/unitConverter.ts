
import type { Ingredient } from '@/lib/types';

// --- TABLE DE CONVERSIONS STANDARD ---
const standardConversions: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  l: 1000,
  ml: 1,
  // Note: 'piece', 'unité', 'botte' are not standard convertible units without context,
  // so they are removed from here and will be handled by equivalences.
};

// --- 1️⃣ FONCTION DE CONVERSION DYNAMIQUE ---
export function getConversionFactor(
  fromUnit: string,
  toUnit: string,
  ingredient?: Ingredient
): number {
  if (!fromUnit || !toUnit) return 1;

  const f = fromUnit.toLowerCase().trim();
  const t = toUnit.toLowerCase().trim();

  // Cas 1 — Même unité
  if (f === t) return 1;

  // Cas 2 — Conversion spécifique à l’ingrédient
  const eq = ingredient?.equivalences || {};
  const key = `${f}->${t}`;
  if (eq[key]) return Number(eq[key]);

  const reverseKey = `${t}->${f}`;
  if (eq[reverseKey]) {
      const reverseValue = Number(eq[reverseKey]);
      return reverseValue === 0 ? 1 : 1 / reverseValue;
  }
  
  // Cas 3 — Conversion standard poids / volume
  if (standardConversions[f] && standardConversions[t]) {
    const bothWeight =
      ["g", "kg", "mg"].includes(f) && ["g", "kg", "mg"].includes(t);
    const bothVolume =
      ["ml", "l"].includes(f) && ["ml", "l"].includes(t);

    if (bothWeight || bothVolume) {
      return standardConversions[f] / standardConversions[t];
    }
  }
  
  // Cas 4 - Conversion indirecte via l'unité de base
   if (ingredient?.baseUnit) {
      const fromBaseFactor = getConversionFactor(f, ingredient.baseUnit, ingredient);
      const baseToTargetFactor = getConversionFactor(ingredient.baseUnit, t, ingredient);
      if(fromBaseFactor !== 1 && baseToTargetFactor !== 1) {
          return fromBaseFactor * baseToTargetFactor;
      }
  }


  // Cas 5 — Conversion impossible à déterminer
  console.warn(`⚠️ Conversion manquante pour '${ingredient?.name}': ${fromUnit} → ${toUnit}`);
  return 1;
}

// --- 2️⃣ FONCTION DE CONVERSION DE QUANTITÉ ---
export function convertQuantity(
  ingredient: Ingredient,
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  const factor = getConversionFactor(fromUnit, toUnit, ingredient);
  return quantity * factor;
}

// --- 3️⃣ CALCUL DU COÛT D’UTILISATION ---
export function computeIngredientCost(
  ingredient: Ingredient,
  usedQuantity: number,
  usedUnit: string
): { cost: number, error?: string } {
  if (ingredient.purchasePrice == null || !ingredient.purchaseWeightGrams) {
    return { cost: 0, error: "Données d'achat (prix, poids) manquantes." };
  }
   if (!ingredient.baseUnit) {
    return { cost: 0, error: "L'unité de base (g/ml) de l'ingrédient n'est pas définie."};
   }

  // coût brut par unité de base (g ou ml)
  const costPerBaseUnitRaw =
    ingredient.purchasePrice / ingredient.purchaseWeightGrams;

  // rendement
  const netCostPerBaseUnit =
    costPerBaseUnitRaw / ((ingredient.yieldPercentage || 100) / 100);

  // conversion quantité → unité de base (g/ml)
  const qtyInBase = convertQuantity(
    ingredient,
    usedQuantity,
    usedUnit,
    ingredient.baseUnit
  );
  
  // Check if conversion failed silently (returned 1 for non-matching units)
  if (qtyInBase === usedQuantity && usedUnit.toLowerCase() !== ingredient.baseUnit.toLowerCase()) {
       const factor = getConversionFactor(usedUnit, ingredient.baseUnit, ingredient);
       if (factor === 1) { // A factor of 1 is the signal for a failed conversion if units are different
          return { cost: 0, error: `Conversion de '${usedUnit}' vers '${ingredient.baseUnit}' non définie.` };
       }
  }
  
  const finalCost = qtyInBase * netCostPerBaseUnit;

  return { cost: isNaN(finalCost) ? 0 : finalCost };
}
