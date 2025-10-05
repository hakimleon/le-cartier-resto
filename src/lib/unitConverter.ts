
// src/lib/unitConverter.ts
import type { Ingredient } from './types';

const standardConversions: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  l: 1000,
  ml: 1,
  cl: 10,
  pièce: 1,
  unité: 1,
  botte: 1,
};

export function getConversionFactor(fromUnit: string, toUnit: string): number {
  if (!fromUnit || !toUnit) return 1;

  const f = fromUnit.toLowerCase().trim();
  const t = toUnit.toLowerCase().trim();

  if (f === t) return 1;

  // Gère uniquement les conversions de poids/volume standard.
  if (standardConversions[f] && standardConversions[t]) {
    const weightUnits = ["g", "kg", "mg"];
    const volumeUnits = ["ml", "l", "cl"];

    const bothWeight = weightUnits.includes(f) && weightUnits.includes(t);
    const bothVolume = volumeUnits.includes(f) && volumeUnits.includes(t);

    // Conversion entre poids et volume (approximation 1g = 1ml)
    if ((bothWeight && !bothVolume) || (!bothWeight && bothVolume)) {
      return standardConversions[f] / standardConversions[t];
    }
    if (bothWeight || bothVolume) {
      return standardConversions[f] / standardConversions[t];
    }
  }

  console.warn(`[CONVERSION] Conversion non standard de '${fromUnit}' vers '${toUnit}' non supportée sans table d'équivalence. Facteur par défaut : 1.`);
  return 1;
}

export function computeIngredientCost(
  ingredient: Ingredient,
  usedQuantity: number,
  usedUnit: string
): { cost: number; error?: string } {
  if (ingredient.purchasePrice == null || ingredient.purchaseWeightGrams == null || ingredient.purchaseWeightGrams === 0) {
    return { cost: 0, error: "Données d'achat (prix, poids/volume) manquantes ou invalides." };
  }
  if (usedQuantity <= 0) return { cost: 0 };

  // Coût par unité de base (g ou ml)
  const costPerBaseUnit = ingredient.purchasePrice / ingredient.purchaseWeightGrams;
  
  // Coût net après rendement
  const netCostPerBaseUnit = costPerBaseUnit / ((ingredient.yieldPercentage || 100) / 100);

  // Unité de base de l'ingrédient (par convention, g ou ml)
  const baseUnit = ['l', 'ml', 'cl'].includes(ingredient.purchaseUnit.toLowerCase()) ? 'ml' : 'g';
  
  // Facteur pour convertir l'unité utilisée vers l'unité de base
  const conversionFactor = getConversionFactor(usedUnit, baseUnit);

  if (conversionFactor === 1 && usedUnit.toLowerCase() !== baseUnit.toLowerCase()) {
    return { cost: 0, error: `Conversion impossible de '${usedUnit}' vers '${baseUnit}'. L'équivalence n'est pas définie.` };
  }

  const quantityInBaseUnit = usedQuantity * conversionFactor;
  const finalCost = quantityInBaseUnit * netCostPerBaseUnit;

  if (isNaN(finalCost)) {
    return { cost: 0, error: "Le résultat du calcul est invalide (NaN)." };
  }

  return { cost: finalCost };
}
