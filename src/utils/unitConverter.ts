
import type { Ingredient } from '@/lib/types';

// --- TABLE DE CONVERSIONS STANDARD ---
const standardConversions: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  l: 1000,
  ml: 1,
  cl: 10,
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

  // Cas 2 - Conversion implicite depuis l'unité d'achat vers l'unité de base
  if (ingredient?.purchaseUnit && ingredient.baseUnit && ingredient.purchaseWeightGrams) {
    if (f === ingredient.purchaseUnit.toLowerCase().trim() && t === ingredient.baseUnit.toLowerCase().trim()) {
      return ingredient.purchaseWeightGrams;
    }
  }

  // Cas 3 — Conversion standard poids / volume
  if (standardConversions[f] && standardConversions[t]) {
    const weightUnits = ["g", "kg", "mg"];
    const volumeUnits = ["ml", "l", "cl"];

    const fIsWeight = weightUnits.includes(f);
    const tIsWeight = weightUnits.includes(t);
    const fIsVolume = volumeUnits.includes(f);
    const tIsVolume = volumeUnits.includes(t);
    
    // Si même famille (poids-poids ou volume-volume), ou si familles différentes (assume 1g = 1ml)
    if ((fIsWeight && tIsWeight) || (fIsVolume && tIsVolume) || (fIsWeight && tIsVolume) || (fIsVolume && tIsWeight)) {
        if(fIsWeight && tIsVolume || fIsVolume && tIsWeight) {
            console.warn(`⚠️ Conversion approximative poids/volume: ${fromUnit} → ${toUnit}.`);
        }
        return standardConversions[f] / standardConversions[t];
    }
  }

  // Cas 4 — Conversion spécifique à l’ingrédient (table d'équivalence)
  const eq = ingredient?.equivalences || {};
  const key = `${f}->${t}`;
  if (eq[key]) return Number(eq[key]);

  const reverseKey = `${t}->${f}`;
  if (eq[reverseKey]) {
      const reverseValue = Number(eq[reverseKey]);
      return reverseValue === 0 ? 1 : 1 / reverseValue;
  }
  
  // Cas 5 - Conversion en chaîne via l'unité de base
  if (ingredient?.baseUnit) {
      const base = ingredient.baseUnit;
      const keyToBase = `${f}->${base}`;
      
      if (eq[keyToBase]) {
          const toBaseFactor = Number(eq[keyToBase]);
          const fromBaseToTargetFactor = getConversionFactor(base, t, ingredient); 
          
          if (fromBaseToTargetFactor === 1 && base !== t) {
             // La chaîne est rompue, on ne continue pas
          } else {
             return toBaseFactor * fromBaseToTargetFactor;
          }
      }
  }

  // Cas 6 — Conversion impossible
  console.warn(`⚠️ Conversion manquante : ${fromUnit} → ${toUnit}`);
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
    if (!ingredient.purchasePrice || !ingredient.purchaseWeightGrams || ingredient.purchaseWeightGrams === 0) {
        return { cost: 0, error: "Données d'achat incomplètes (prix ou poids)." };
    }
    if (!ingredient.baseUnit) {
        return { cost: 0, error: "L'unité de base (g/ml) de l'ingrédient n'est pas définie."};
    }
    if (usedQuantity <= 0) return { cost: 0 };

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
    
    const finalCost = qtyInBase * netCostPerBaseUnit;

    return { cost: isNaN(finalCost) ? 0 : finalCost };
}
