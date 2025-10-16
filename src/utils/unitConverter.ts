
import type { Ingredient } from '@/lib/types';

const standardMetricConversions: Record<string, number> = {
  g: 1, kg: 1000, mg: 0.001,
  l: 1000, ml: 1, cl: 10,
};

const weightUnits = ['g', 'kg', 'mg'];
const volumeUnits = ['l', 'ml', 'cl'];

function getFactor(from: string, to: string, equivalences: Record<string, string | number>): number | null {
    const f = from.toLowerCase().trim();
    const t = to.toLowerCase().trim();

    if (f === t) return 1;

    // 1. Direct & Reverse Equivalence
    const directKey = `${f}->${t}`;
    if (equivalences[directKey] !== undefined) return Number(equivalences[directKey]);

    const reverseKey = `${t}->${f}`;
    if (equivalences[reverseKey] !== undefined) {
        const reverseFactor = Number(equivalences[reverseKey]);
        return reverseFactor === 0 ? null : 1 / reverseFactor;
    }

    // 2. Standard Metric Conversions
    const fromFactor = standardMetricConversions[f];
    const toFactor = standardMetricConversions[t];
    if (fromFactor !== undefined && toFactor !== undefined) {
        const fromIsWeight = weightUnits.includes(f);
        const toIsWeight = weightUnits.includes(t);
        const fromIsVolume = volumeUnits.includes(f);
        const toIsVolume = volumeUnits.includes(t);

        // Allow conversion between weight/volume, assuming 1g = 1ml
        if ((fromIsWeight && toIsWeight) || (fromIsVolume && toIsVolume) || (fromIsWeight && toIsVolume) || (fromIsVolume && toIsWeight)) {
            return fromFactor / toFactor;
        }
    }
    
    return null; // Not found
}


export function getConversionFactor(fromUnit: string, toUnit: string, ingredient?: Partial<Pick<Ingredient, 'baseUnit' | 'equivalences'>>): number {
    const f = fromUnit.toLowerCase().trim();
    const t = toUnit.toLowerCase().trim();
    const equivalences = ingredient?.equivalences || {};

    if (f === t) return 1;

    // Attempt 1: Direct conversion (including standard metric)
    let factor = getFactor(f, t, equivalences);
    if (factor !== null) return factor;

    // Attempt 2: Chained conversion via baseUnit
    if (ingredient?.baseUnit) {
        const baseUnit = ingredient.baseUnit;
        const fromToBaseFactor = getFactor(f, baseUnit, equivalences);
        const baseToTargetFactor = getFactor(baseUnit, t, equivalences);

        if (fromToBaseFactor !== null && baseToTargetFactor !== null) {
            return fromToBaseFactor * baseToTargetFactor;
        }
    }

    console.warn(`[CONVERSION] Conversion manquante : ${fromUnit} → ${toUnit}. Facteur par défaut : 1.`);
    return 1;
}

export function convertQuantity(
    ingredient: Partial<Pick<Ingredient, 'baseUnit' | 'equivalences'>>,
    quantity: number,
    fromUnit: string,
    toUnit: string
): number {
    const factor = getConversionFactor(fromUnit, toUnit, ingredient);
    return quantity * factor;
}

export function computeIngredientCost(
    ingredient: Pick<Ingredient, 'purchasePrice' | 'purchaseWeightGrams' | 'yieldPercentage' | 'baseUnit' | 'equivalences'>,
    usedQuantity: number,
    usedUnit: string
): { cost: number; error?: string } {
    if (!ingredient.purchasePrice || ingredient.purchasePrice <= 0 || !ingredient.purchaseWeightGrams || ingredient.purchaseWeightGrams <= 0) {
        return { cost: 0, error: "Données d'achat (prix > 0, poids/volume > 0) invalides." };
    }
    if (!ingredient.baseUnit) {
        return { cost: 0, error: "L'unité de base (g/ml) de l'ingrédient n'est pas définie." };
    }
    if (usedQuantity <= 0) return { cost: 0 };

    const costPerBaseUnitRaw = ingredient.purchasePrice / ingredient.purchaseWeightGrams;
    const netCostPerBaseUnit = costPerBaseUnitRaw / ((ingredient.yieldPercentage || 100) / 100);

    const qtyInBase = convertQuantity(ingredient, usedQuantity, usedUnit, ingredient.baseUnit);
    
    const finalCost = qtyInBase * netCostPerBaseUnit;
    
    if (isNaN(finalCost)) {
        return { cost: 0, error: "Le résultat du calcul est invalide (NaN)." };
    }

    if (qtyInBase === usedQuantity && usedUnit.toLowerCase().trim() !== ingredient.baseUnit.toLowerCase().trim()) {
        const factor = getConversionFactor(usedUnit, ingredient.baseUnit, ingredient);
        if (factor === 1) {
             const standardUnits = ['g', 'kg', 'mg', 'l', 'ml', 'cl'];
             const fromIsStandard = standardUnits.includes(usedUnit.toLowerCase().trim());
             const toIsStandard = standardUnits.includes(ingredient.baseUnit.toLowerCase().trim());
             if (!fromIsStandard || !toIsStandard) {
                 return { cost: finalCost, error: `Conversion de '${usedUnit}' vers '${ingredient.baseUnit}' non définie. Coût potentiellement incorrect.` };
             }
        }
    }

    return { cost: finalCost };
}
