

"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ingredient, Recipe, RecipeIngredient, units as availableUnits, conversions } from "@/data/definitions"
import { Textarea } from "@/components/ui/textarea"

// --- Helper Functions ---
const convertUnits = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;
    const conversion = conversions.find(c => c.fromUnit === fromUnit && c.toUnit === toUnit);
    if (conversion) return quantity * conversion.factor;
    const reverseConversion = conversions.find(c => c.fromUnit === toUnit && c.toUnit === fromUnit);
    if (reverseConversion) return quantity / reverseConversion.factor;
    console.warn(`No conversion found from ${fromUnit} to ${toUnit}`);
    return quantity;
};

const calculateIngredientCost = (
    quantity: number, 
    unitUse: string, 
    ingredient: { unitPurchase: string; unitPrice: number },
): number => {
    if (!ingredient || !ingredient.unitPurchase || !ingredient.unitPrice) return 0;
    const quantityInPurchaseUnits = convertUnits(quantity, unitUse, ingredient.unitPurchase);
    return quantityInPurchaseUnits * ingredient.unitPrice;
};

// --- Types ---
interface FormIngredient extends Omit<RecipeIngredient, 'recipeId'> {
  category: string;
  unitPrice: number; // Price per purchase unit
  unitPurchase: string;
  totalCost: number;
  name: string; // Name of the ingredient
}

// --- Component ---
interface RecipeCostFormProps {
  recipe: Recipe | null
  recipes: Recipe[]
  ingredients: Ingredient[]
  recipeIngredients: RecipeIngredient[]
}

export function RecipeCostForm({
  recipe: initialRecipe,
  recipes: allRecipes,
  ingredients: stockIngredients,
  recipeIngredients: allRecipeIngredients,
}: RecipeCostFormProps) {
  
  const [dishName, setDishName] = React.useState(initialRecipe?.name || "");
  const [portions, setPortions] = React.useState(1);
  const [formIngredients, setFormIngredients] = React.useState<FormIngredient[]>([]);

  React.useEffect(() => {
    if (initialRecipe) {
      const existingIngredients = allRecipeIngredients
        .filter(ri => ri.recipeId === initialRecipe.id)
        .map(ri => {
          const stockIng = stockIngredients.find(si => si.id === ri.ingredientId);
          if (!stockIng) return null;
          
          const cost = calculateIngredientCost(ri.quantity, ri.unitUse, {
            unitPurchase: stockIng.unitPurchase,
            unitPrice: stockIng.unitPrice
          });

          return {
            id: ri.id,
            ingredientId: ri.ingredientId,
            name: stockIng.name,
            quantity: ri.quantity,
            unitUse: ri.unitUse,
            category: stockIng.category,
            unitPrice: stockIng.unitPrice,
            unitPurchase: stockIng.unitPurchase,
            totalCost: cost,
          };
        })
        .filter((i): i is FormIngredient => i !== null);
      
      setFormIngredients(existingIngredients);
    }
  }, [initialRecipe, allRecipeIngredients, stockIngredients]);


  const addIngredientRow = () => {
    setFormIngredients(prev => [...prev, {
      id: `new-${Date.now()}`,
      ingredientId: '',
      name: '',
      quantity: 0,
      unitUse: 'g',
      category: '',
      unitPrice: 0,
      unitPurchase: '',
      totalCost: 0,
    }]);
  };

  const removeIngredientRow = (index: number) => {
    setFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectIngredient = (index: number, ingredientId: string) => {
    const selected = stockIngredients.find(ing => ing.id === ingredientId);
    if (!selected) {
        // Reset if "Sélectionner..." is chosen
        setFormIngredients(prev => {
            const newIngredients = [...prev];
            newIngredients[index] = {
              id: newIngredients[index].id,
              ingredientId: '',
              name: '',
              quantity: 0,
              unitUse: 'g',
              category: '',
              unitPrice: 0,
              unitPurchase: '',
              totalCost: 0,
            };
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
            category: selected.category,
            unitPrice: selected.unitPrice,
            unitPurchase: selected.unitPurchase,
            totalCost: newCost,
            unitUse: 'g' // Default to 'g' on new selection
        };
        
        return newIngredients;
    });
};


  const updateIngredientField = (index: number, field: keyof FormIngredient, value: any) => {
    setFormIngredients(prev => {
        const newIngredients = [...prev];
        const ingredient = { ...newIngredients[index], [field]: value };

        const stockIng = stockIngredients.find(si => si.id === ingredient.ingredientId);
        if (stockIng) {
            ingredient.totalCost = calculateIngredientCost(ingredient.quantity, ingredient.unitUse, stockIng);
        }
        
        newIngredients[index] = ingredient;
        return newIngredients;
    });
  };

  const totalCost = formIngredients.reduce((acc, ing) => acc + ing.totalCost, 0);
  const costPerPortion = portions > 0 ? totalCost / portions : 0;

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Détails de la recette</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="dishName">Nom du plat</Label>
                    <Input id="dishName" value={dishName} onChange={(e) => setDishName(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="portions">Nombre de portions</Label>
                    <Input id="portions" type="number" value={portions} onChange={(e) => setPortions(Number(e.target.value))} min="1" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ingrédients & Coûts</CardTitle>
              <Button onClick={addIngredientRow} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Ajouter un ingrédient
              </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-sm text-muted-foreground">
                            <tr className="border-b">
                                <th className="p-2 text-left font-medium min-w-[250px]">Ingrédient</th>
                                <th className="p-2 text-left font-medium">Quantité</th>
                                <th className="p-2 text-left font-medium">Unité</th>
                                <th className="p-2 text-right font-medium">Coût Total</th>
                                <th className="p-2 text-center font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formIngredients.map((ing, index) => (
                                <tr key={ing.id} className="border-b">
                                    <td className="p-2">
                                       <select
                                            value={ing.ingredientId}
                                            onChange={(e) => handleSelectIngredient(index, e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Sélectionner...</option>
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
                                          onChange={(e) => updateIngredientField(index, 'quantity', Number(e.target.value))}
                                          className="w-24"
                                          disabled={!ing.ingredientId}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={ing.unitUse}
                                            onChange={(e) => updateIngredientField(index, 'unitUse', e.target.value)}
                                            disabled={!ing.ingredientId}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {availableUnits.map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-right font-mono">{ing.totalCost.toFixed(2)} DZD</td>
                                    <td className="p-2 text-center">
                                        <Button variant="ghost" size="icon" onClick={() => removeIngredientRow(index)}>
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
                        <p className="text-sm text-muted-foreground">Coût Total</p>
                        <p className="text-lg font-bold">{totalCost.toFixed(2)} DZD</p>
                    </div>
                     <div className="text-right">
                        <p className="text-sm text-muted-foreground">Coût / Portion</p>
                        <p className="text-lg font-bold text-primary">{costPerPortion.toFixed(2)} DZD</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {/* Placeholder for other sections */}
        <Card>
            <CardHeader><CardTitle>Procédure</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="preparation">Préparation</Label>
                    <Textarea id="preparation" placeholder="Étapes de préparation..."></Textarea>
                </div>
                <div>
                    <Label htmlFor="cuisson">Cuisson</Label>
                    <Textarea id="cuisson" placeholder="Instructions de cuisson..."></Textarea>
                </div>
                <div>
                    <Label htmlFor="service">Service</Label>
                    <Textarea id="service" placeholder="Instructions de service..."></Textarea>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost">Annuler</Button>
            <Button>Sauvegarder</Button>
        </div>
    </div>
  );
}
