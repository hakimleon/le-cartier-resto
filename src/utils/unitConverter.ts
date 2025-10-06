
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

  // Cas 2 - Conversion standard (poids <-> poids, volume <-> volume)
  const fFactor = standardConversions[f];
  const tFactor = standardConversions[t];
  if (fFactor && tFactor) {
    const fIsWeight = ["g", "kg", "mg"].includes(f);
    const tIsWeight = ["g", "kg", "mg"].includes(t);
    const fIsVolume = ["l", "ml", "cl"].includes(f);
    const tIsVolume = ["l", "ml", "cl"].includes(t);

    if ((fIsWeight && tIsWeight) || (fIsVolume && tIsVolume)) {
      return fFactor / tFactor;
    }
  }

  // Cas 3 — Conversion spécifique à l’ingrédient (directe)
  const eq = ingredient?.equivalences || {};
  const directKey = `${f}->${t}`;
  if (eq[directKey]) {
    const value = Number(eq[directKey]);
    return isNaN(value) ? 1 : value;
  }

  const reverseKey = `${t}->${f}`;
  if (eq[reverseKey]) {
      const reverseValue = Number(eq[reverseKey]);
      return reverseValue === 0 ? 1 : 1 / reverseValue;
  }

  // Cas 4 — Conversion en chaîne via une unité de base (ex: pièce -> g -> kg)
  if (ingredient?.baseUnit) {
    const base = ingredient.baseUnit;
    const keyToBase = `${f}->${base}`;
    
    // On ne fait une récursion que si on a un chemin direct vers l'unité de base.
    // Ceci évite la boucle infinie.
    if (eq[keyToBase]) {
      const fromToBaseFactor = Number(eq[keyToBase]);
      
      // Appel récursif pour la deuxième partie de la chaîne (ex: g -> kg)
      // Cet appel se résoudra généralement par le Cas 2 (standard).
      const baseToTargetFactor = getConversionFactor(base, t, ingredient);
      
      // Si la deuxième partie de la chaîne a échoué (retourné 1 alors que base !== t), on ne continue pas.
      if (baseToTargetFactor === 1 && base !== t) {
         // Laisse tomber et passe au warning final
      } else {
         return fromToBaseFactor * baseToTargetFactor;
      }
    }
  }

  // Cas 5 — Conversion impossible à déterminer
  console.warn(`⚠️ Conversion manquante pour l'ingrédient '${ingredient?.name}': ${fromUnit} → ${toUnit}`);
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
    if (ingredient.purchasePrice == null || !ingredient.purchaseWeightGrams || ingredient.purchaseWeightGrams === 0) {
        return { cost: 0, error: "Données d'achat incomplètes (prix ou poids)." };
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
    
    // Vérifie si la conversion a échoué silencieusement
    if (qtyInBase === usedQuantity && usedUnit.toLowerCase() !== ingredient.baseUnit.toLowerCase()) {
         const factor = getConversionFactor(usedUnit, ingredient.baseUnit, ingredient);
         if (factor === 1) { // Un facteur de 1 est le signal d'un échec si les unités sont différentes
            return { cost: 0, error: `Conversion de '${usedUnit}' vers '${ingredient.baseUnit}' non définie.` };
         }
    }
    
    const finalCost = qtyInBase * netCostPerBaseUnit;

    return { cost: isNaN(finalCost) ? 0 : finalCost };
}
