
// src/lib/unitConverter.ts
import type { Ingredient } from './types';

/**
 * Converts a quantity from a given unit to a target unit, using standard conversions 
 * and ingredient-specific equivalences.
 * @param fromUnit The unit to convert from (e.g., 'pièce', 'kg').
 * @param toUnit The unit to convert to (e.g., 'g', 'ml').
 * @param ingredient The ingredient object, containing optional 'equivalences' and 'baseUnit'.
 * @returns The conversion factor. Returns 1 if conversion is not possible or not needed.
 */
export function getConversionFactor(fromUnit: string, toUnit: string, ingredient?: Ingredient): number {
  const f = fromUnit.toLowerCase().trim();
  const t = toUnit.toLowerCase().trim();

  if (!f || !t || f === t) return 1;

  // 1. Direct lookup in ingredient's equivalences table
  if (ingredient?.equivalences) {
    const directKey = `${f}->${t}`;
    if (ingredient.equivalences[directKey] !== undefined) {
      return Number(ingredient.equivalences[directKey]);
    }
    const reverseKey = `${t}->${f}`;
    if (ingredient.equivalences[reverseKey] !== undefined) {
      const reverseFactor = Number(ingredient.equivalences[reverseKey]);
      return reverseFactor !== 0 ? 1 / reverseFactor : 0;
    }
  }

  // 2. Standard metric conversions
  const standardConversions: Record<string, number> = {
    g: 1, kg: 1000, mg: 0.001,
    l: 1000, ml: 1, cl: 10,
  };
  const fromFactor = standardConversions[f];
  const toFactor = standardConversions[t];

  if (fromFactor !== undefined && toFactor !== undefined) {
    return fromFactor / toFactor;
  }
  
  // 3. Chained conversion via baseUnit (e.g., pièce -> g -> kg)
  if (ingredient?.baseUnit && ingredient?.equivalences) {
    const baseUnit = ingredient.baseUnit;
    const fromToBaseKey = `${f}->${baseUnit}`;
    const fromToBaseFactor = ingredient.equivalences[fromToBaseKey];

    if (fromToBaseFactor !== undefined) {
      // We have piece -> g. Now we need g -> kg.
      // This part is a simple recursive call with standard units.
      const baseToTargetFactor = getConversionFactor(baseUnit, t);
      if (baseToTargetFactor !== 1) { // Check if a standard conversion was found
          return fromToBaseFactor * baseToTargetFactor;
      }
    }
  }

  // If no conversion is found, return 1 and log a warning.
  console.warn(`[CONVERSION] Conversion impossible entre '${fromUnit}' et '${toUnit}'. Facteur par défaut : 1.`);
  return 1;
}

/**
 * Calculates the cost of a used ingredient based on its purchase data and yield.
 * @param ingredient The full ingredient object from the database.
 * @param usedQuantity The quantity of the ingredient used in a recipe.
 * @param usedUnit The unit of the quantity used.
 * @returns An object containing the calculated cost and an optional error message.
 */
export function computeIngredientCost(
  ingredient: Ingredient,
  usedQuantity: number,
  usedUnit: string
): { cost: number; error?: string } {
  if (ingredient.purchasePrice == null || ingredient.purchaseWeightGrams == null || ingredient.purchaseWeightGrams === 0) {
    return { cost: 0, error: "Données d'achat (prix, poids/volume) manquantes ou invalides." };
  }
  if (usedQuantity <= 0) return { cost: 0 };

  // Determine the base unit for calculation (g or ml)
  const baseUnit = ingredient.baseUnit || 'g';

  // Cost per base unit (e.g., cost per gram) based on purchase price
  const costPerBaseUnitRaw = ingredient.purchasePrice / ingredient.purchaseWeightGrams;
  
  // Net cost after accounting for yield (parage)
  const netCostPerBaseUnit = costPerBaseUnitRaw / ((ingredient.yieldPercentage || 100) / 100);

  // Get the factor to convert the recipe's unit (e.g., 'pièce') to the ingredient's base unit ('g')
  const conversionFactor = getConversionFactor(usedUnit, baseUnit, ingredient);

  // If conversion factor is 1, it might be because units are the same OR no conversion was found.
  if (conversionFactor === 1 && usedUnit.toLowerCase() !== baseUnit) {
      // Check if it's a standard unit that just happens to have a 1:1 conversion (e.g. g -> ml)
      const standardUnits = ['g', 'ml'];
      if (!(standardUnits.includes(usedUnit.toLowerCase()) && standardUnits.includes(baseUnit))) {
          return { cost: 0, error: `Conversion de '${usedUnit}' vers '${baseUnit}' non définie. Veuillez ajouter une équivalence pour cet ingrédient.` };
      }
  }

  // Final calculation
  const quantityInBaseUnit = usedQuantity * conversionFactor;
  const finalCost = quantityInBaseUnit * netCostPerBaseUnit;

  if (isNaN(finalCost)) {
    return { cost: 0, error: "Le résultat du calcul est invalide (NaN)." };
  }

  return { cost: finalCost };
}
