

"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ingredient, Recipe, RecipeIngredient, units as availableUnits, conversions } from "@/data/definitions"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { saveRecipeSheet } from "./actions"

// --- Helper Functions ---
const convertUnits = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;
    const conversion = conversions.find(c => c.fromUnit === fromUnit && c.toUnit === toUnit);
    if (conversion) return quantity * conversion.factor;
    const reverseConversion = conversions.find(c => c.fromUnit === toUnit && c.toUnit === fromUnit);
    if (reverseConversion) return quantity / reverseConversion.factor;
    console.warn(`No conversion factor found between ${fromUnit} and ${toUnit}. Returning original quantity.`);
    return quantity; 
};

const calculateIngredientCost = (
    quantity: number, 
    unitUse: string, 
    ingredient?: { unitPurchase: string; unitPrice: number },
): number => {
    if (!ingredient || !ingredient.unitPurchase || !ingredient.unitPrice) return 0;
    const quantityInPurchaseUnits = convertUnits(quantity, unitUse, ingredient.unitPurchase);
    return quantityInPurchaseUnits * ingredient.unitPrice;
};

// --- Types ---
export interface FormIngredient extends Omit<RecipeIngredient, 'recipeId'> {
  name: string;
  totalCost: number;
}

// --- Component ---
interface RecipeCostFormProps {
  recipe: Recipe | null
  ingredients: Ingredient[]
  recipeIngredients: RecipeIngredient[]
}

export function RecipeCostForm({
  recipe: initialRecipe,
  ingredients: stockIngredients,
  recipeIngredients: allRecipeIngredients,
}: RecipeCostFormProps) {
  
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [dishName, setDishName] = React.useState(initialRecipe?.name || "");
  const [portions, setPortions] = React.useState(1);
  const [procedure, setProcedure] = React.useState(initialRecipe?.procedure || { preparation: [], cuisson: [], service: [] });
  const [formIngredients, setFormIngredients] = React.useState<FormIngredient[]>([]);

  React.useEffect(() => {
    if (initialRecipe) {
      const existingIngredients = allRecipeIngredients
        .filter(ri => ri.recipeId === initialRecipe.id)
        .map(ri => {
          const stockIng = stockIngredients.find(si => si.id === ri.ingredientId);
          const cost = calculateIngredientCost(ri.quantity, ri.unitUse, stockIng);

          return {
            id: ri.id,
            ingredientId: ri.ingredientId,
            name: stockIng?.name || '',
            quantity: ri.quantity,
            unitUse: ri.unitUse,
            totalCost: cost,
          };
        })
        .filter((i): i is FormIngredient => i !== null);
      
      setFormIngredients(existingIngredients);
      setDishName(initialRecipe.name);
      setProcedure(initialRecipe.procedure || { preparation: [], cuisson: [], service: [] });
      setPortions(1); 
    }
  }, [initialRecipe, allRecipeIngredients, stockIngredients]);


  const addIngredientRow = () => {
    setFormIngredients(prev => [...prev, {
      id: `new-${Date.now()}`,
      ingredientId: '',
      name: '',
      quantity: 0,
      unitUse: 'g',
      totalCost: 0,
    }]);
  };

  const removeIngredientRow = (index: number) => {
    setFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectIngredient = (index: number, ingredientId: string) => {
    const selected = stockIngredients.find(ing => ing.id === ingredientId);
    if (!selected) {
        setFormIngredients(prev => {
            const newIngredients = [...prev];
            const current = newIngredients[index];
            newIngredients[index] = { ...current, ingredientId: '', name: '', totalCost: 0 };
            return newIngredients;
        });
        return;
    };

    setFormIngredients(prev => {
        const newIngredients = [...prev];
        const current = newIngredients[index];
        if (!current) return prev;

        const newCost = calculateIngredientCost(current.quantity, current.unitUse, selected);

        newIngredients[index] = {
            ...current,
            ingredientId: selected.id,
            name: selected.name,
            totalCost: newCost,
            unitUse: current.unitUse || 'g',
        };
        
        return newIngredients;
    });
};


  const updateIngredientField = (index: number, field: 'quantity' | 'unitUse', value: any) => {
    setFormIngredients(prev => {
        const newIngredients = [...prev];
        const ingredientToUpdate = newIngredients[index];
        
        if (ingredientToUpdate) {
            if(field === 'quantity') ingredientToUpdate.quantity = parseFloat(value) || 0;
            if(field === 'unitUse') ingredientToUpdate.unitUse = value;
            
            const stockIng = stockIngredients.find(si => si.id === ingredientToUpdate.ingredientId);
            if (stockIng) {
                ingredientToUpdate.totalCost = calculateIngredientCost(ingredientToUpdate.quantity, ingredientToUpdate.unitUse, stockIng);
            }
            newIngredients[index] = ingredientToUpdate;
        }

        return newIngredients;
    });
  };
  
  const handleProcedureChange = (field: 'preparation' | 'cuisson' | 'service', value: string) => {
    setProcedure(prev => ({
        ...prev,
        [field]: value.split('\n')
    }));
  };

  // --- Financial Calculations ---
  const VAT_RATE = 0.19;
  const totalCost = formIngredients.reduce((acc, ing) => acc + ing.totalCost, 0);
  const costPerPortion = portions > 0 ? totalCost / portions : 0;
  
  const sellingPriceTTC = initialRecipe?.price || 0;
  const sellingPriceHT = sellingPriceTTC / (1 + VAT_RATE);

  const foodCost = sellingPriceHT > 0 ? (costPerPortion / sellingPriceHT) * 100 : 0;
  const coefficient = costPerPortion > 0 ? sellingPriceHT / costPerPortion : 0;
  const grossMarginValue = sellingPriceHT - costPerPortion;
  const grossMarginPercent = sellingPriceHT > 0 ? (grossMarginValue / sellingPriceHT) * 100 : 0;

  const handleSave = async () => {
    if (!initialRecipe) {
        toast({ title: "Erreur", description: "Impossible de sauvegarder une fiche sans plat associé.", variant: "destructive"});
        return;
    }
    
    setIsSaving(true);
    
    const dataToSave = {
        recipeId: initialRecipe.id,
        cost: costPerPortion,
        procedure: procedure,
        ingredients: formIngredients.map(ing => ({
            id: ing.id,
            recipeId: initialRecipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unitUse: ing.unitUse,
        })).filter(ing => ing.ingredientId), // Filter out empty rows
    };

    try {
        const result = await saveRecipeSheet(dataToSave);
        if (result.success) {
            toast({
              title: "Fiche technique sauvegardée !",
              description: `La fiche pour "${dishName}" a été mise à jour avec succès.`,
            });
            router.push('/menu');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
        toast({
          title: "Erreur lors de la sauvegarde",
          description: errorMessage,
          variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };
  
  const FinancialInfo = ({ label, value, className }: { label: string, value: string, className?: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${className}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Détails de la recette</CardTitle>
                <CardDescription>Informations générales et financières du plat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="dishName">Nom du plat</Label>
                        <Input id="dishName" value={dishName} readOnly disabled className="border-none p-0 h-auto text-base font-semibold" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="portions">Nombre de portions</Label>
                        <Input id="portions" type="number" value={portions} onChange={(e) => setPortions(Number(e.target.value))} min="1" />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-2">
                   <FinancialInfo label="Prix Vente (TTC)" value={`${sellingPriceTTC.toFixed(2)} DZD`} />
                   <FinancialInfo label="Prix Vente (HT)" value={`${sellingPriceHT.toFixed(2)} DZD`} />
                   <FinancialInfo label="Marge Brute (HT)" value={`${grossMarginValue.toFixed(2)} DZD`} className="text-green-600" />
                   <FinancialInfo label="Marge Brute (%)" value={`${grossMarginPercent.toFixed(1)} %`} className="text-green-600" />
                   <FinancialInfo label="Food Cost (%)" value={`${foodCost.toFixed(1)} %`} className="text-purple-600" />
                   <FinancialInfo label="Coeff. Multiplicateur" value={`x ${coefficient.toFixed(2)}`} className="text-blue-600" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ingrédients & Coûts</CardTitle>
              <Button onClick={addIngredientRow} size="sm" disabled={isSaving}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter un ingrédient
              </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 font-medium text-muted-foreground min-w-[250px]">Ingrédient</th>
                                <th className="p-2 font-medium text-muted-foreground">Quantité</th>
                                <th className="p-2 font-medium text-muted-foreground">Unité</th>
                                <th className="p-2 font-medium text-muted-foreground text-right">Coût Total</th>
                                <th className="p-2 font-medium text-muted-foreground text-center w-[50px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formIngredients.map((ing, index) => (
                                <tr key={ing.id} className="border-b">
                                    <td className="p-2">
                                       <select
                                            value={ing.ingredientId}
                                            onChange={(e) => handleSelectIngredient(index, e.target.value)}
                                            className="w-full bg-background border border-input rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            disabled={isSaving}
                                        >
                                            <option value="">Sélectionner un ingrédient...</option>
                                            {stockIngredients.map((stockIng) => (
                                                <option key={stockIng.id} value={stockIng.id}>
                                                    {stockIng.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <Input
                                          type="number"
                                          value={ing.quantity}
                                          onChange={(e) => updateIngredientField(index, 'quantity', e.target.value)}
                                          className="w-24"
                                          disabled={!ing.ingredientId || isSaving}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={ing.unitUse}
                                            onChange={(e) => updateIngredientField(index, 'unitUse', e.target.value)}
                                            disabled={!ing.ingredientId || isSaving}
                                            className="w-full bg-background border border-input rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {availableUnits.map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-right font-mono">{ing.totalCost.toFixed(2)} DZD</td>
                                    <td className="p-2 text-center">
                                        <Button variant="ghost" size="icon" onClick={() => removeIngredientRow(index)} disabled={isSaving}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end gap-8 p-4 bg-muted rounded-lg">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Coût Total Recette</p>
                        <p className="text-xl font-bold">{totalCost.toFixed(2)} DZD</p>
                    </div>
                     <div className="text-right">
                        <p className="text-sm text-muted-foreground">Coût / Portion</p>
                        <p className="text-xl font-bold">{costPerPortion.toFixed(2)} DZD</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Procédure</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="preparation">Préparation</Label>
                    <Textarea 
                        id="preparation" 
                        placeholder="Étapes de préparation..." 
                        value={Array.isArray(procedure.preparation) ? procedure.preparation.join('\\n') : ''}
                        onChange={(e) => handleProcedureChange('preparation', e.target.value)}
                        disabled={isSaving}
                        rows={5}
                    />
                </div>
                <div>
                    <Label htmlFor="cuisson">Cuisson</Label>
                    <Textarea 
                        id="cuisson" 
                        placeholder="Instructions de cuisson..."
                        value={Array.isArray(procedure.cuisson) ? procedure.cuisson.join('\\n') : ''}
                        onChange={(e) => handleProcedureChange('cuisson', e.target.value)}
                        disabled={isSaving}
                        rows={5}
                    />
                </div>
                <div>
                    <Label htmlFor="service">Service</Label>
                    <Textarea 
                        id="service" 
                        placeholder="Instructions de service..."
                        value={Array.isArray(procedure.service) ? procedure.service.join('\\n') : ''}
                        onChange={(e) => handleProcedureChange('service', e.target.value)}
                        disabled={isSaving}
                        rows={3}
                    />
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder'}
            </Button>
        </div>
    </div>
  );
}
