

"use client";

import { useState, useMemo, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Save, Trash2, X } from "lucide-react";
import { categories as menuCategories, Recipe, Ingredient as StockIngredient, conversions } from "@/data/definitions";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface FormIngredient {
  id: number;
  stockId: string;
  name: string;
  unitUse: string;
  unitCost: number; // Cost per purchase unit
  unitPurchase: string;
  quantity: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace("DZD", "").trim() + " DA";
};

const calculateIngredientCost = (ing: FormIngredient) => {
    if (!ing.unitPurchase || !ing.unitUse || !ing.unitCost || !ing.quantity) return 0;
    
    if (ing.unitPurchase.toLowerCase() === ing.unitUse.toLowerCase()) {
        return ing.unitCost * ing.quantity;
    }

    const conversion = conversions.find(c => c.fromUnit.toLowerCase() === ing.unitPurchase.toLowerCase() && c.toUnit.toLowerCase() === ing.unitUse.toLowerCase());
    
    if (conversion) {
        const costPerUseUnit = ing.unitCost / conversion.factor;
        return costPerUseUnit * ing.quantity;
    }

    // Fallback if no direct conversion is found
    return 0;
};


type RecipeCostFormProps = {
  recipe: Recipe | null;
  recipes: Recipe[];
  ingredients: StockIngredient[];
  recipeIngredients: any[]; // Adjust type as needed
};

export function RecipeCostForm({ recipe, recipes, ingredients: stockIngredients, recipeIngredients: allRecipeIngredients }: RecipeCostFormProps) {
  const { toast } = useToast();
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState(menuCategories[0]);
  const [priceTTC, setPriceTTC] = useState(0);
  const [vatRate, setVatRate] = useState(19);
  const [portions, setPortions] = useState(1);
  const [ingredients, setIngredients] = useState<FormIngredient[]>([]);
  
  const [preparation, setPreparation] = useState("");
  const [cooking, setCooking] = useState("");
  const [service, setService] = useState("");
  
  const [allergenInput, setAllergenInput] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  
  const [salesPitch, setSalesPitch] = useState("");


  useEffect(() => {
    if (recipe) {
      setDishName(recipe.name);
      setCategory(recipe.category);
      setPriceTTC(recipe.price);
      setPortions(1); 
      
      const relatedIngredients = allRecipeIngredients
        .filter(ri => ri.recipeId === recipe.id)
        .map((ri, index) => {
          const stockItem = stockIngredients.find(item => item.id === ri.ingredientId);
          return {
            id: Date.now() + index,
            stockId: stockItem?.id || '',
            name: stockItem?.name || '',
            unitUse: ri.unitUse,
            unitCost: stockItem?.unitPrice || 0,
            unitPurchase: stockItem?.unitPurchase || '',
            quantity: ri.quantity || 0,
          }
        });

      setIngredients(relatedIngredients);
      setPreparation(recipe.procedure.preparation.join('\\n'));
      setCooking(recipe.procedure.cuisson.join('\\n'));
      setService(recipe.procedure.service.join('\\n'));
      setAllergens(recipe.allergens);
      setSalesPitch(recipe.argumentationCommerciale || '');
    }
  }, [recipe, allRecipeIngredients, stockIngredients]);


  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now(), stockId: "", name: "", unitUse: "g", unitCost: 0, unitPurchase: 'kg', quantity: 0 },
    ]);
  };

  const handleRemoveIngredient = (id: number) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };
  
  const handleIngredientChange = (id: number, field: keyof FormIngredient, value: string | number) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };
  
  const handleSelectIngredient = (ingredientRowId: number, selectedStockId: string) => {
    const stockItem = stockIngredients.find(item => item.id === selectedStockId);

    if (stockItem) {
        setIngredients(
            ingredients.map(ing =>
                ing.id === ingredientRowId
                    ? {
                        ...ing,
                        stockId: stockItem.id,
                        name: stockItem.name,
                        unitUse: ing.unitUse, // Keep user-defined unit of use
                        unitCost: stockItem.unitPrice,
                        unitPurchase: stockItem.unitPurchase,
                      }
                    : ing
            )
        );
    }
  };
  
  const totalIngredientCost = useMemo(() => {
    return ingredients.reduce((total, ing) => total + calculateIngredientCost(ing), 0);
  }, [ingredients]);

  const { priceHT, costPerPortion, unitMargin, costPercentage } = useMemo(() => {
    const priceHT = priceTTC / (1 + vatRate / 100);
    const costPerPortion = portions > 0 ? totalIngredientCost / portions : 0;
    const unitMargin = priceHT - costPerPortion;
    const costPercentage = priceHT > 0 ? (costPerPortion / priceHT) * 100 : 0;
    return { priceHT, costPerPortion, unitMargin, costPercentage };
  }, [priceTTC, vatRate, portions, totalIngredientCost]);

  const handleAddAllergen = () => {
    if (allergenInput.trim() && !allergens.includes(allergenInput.trim())) {
      setAllergens([...allergens, allergenInput.trim()]);
      setAllergenInput("");
    }
  };

  const handleAllergenKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAllergen();
    }
  };
  
  const handleRemoveAllergen = (allergenToRemove: string) => {
    setAllergens(allergens.filter(allergen => allergen !== allergenToRemove));
  };

  const ingredientOptions = useMemo(() => {
    return stockIngredients.map(item => ({
      value: item.id,
      label: item.name,
    }));
  }, [stockIngredients]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Fiche technique sauvegardée !",
      description: `Les informations pour "${dishName}" ont été mises à jour.`,
    });
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dishName">Nom du plat</Label>
              <Input id="dishName" value={dishName} onChange={(e: ChangeEvent<HTMLInputElement>) => setDishName(e.target.value)} placeholder="Nom du plat" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Ex: Plat - Viande" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceTTC">Prix TTC (DA)</Label>
              <Input id="priceTTC" type="number" value={priceTTC} onChange={(e: ChangeEvent<HTMLInputElement>) => setPriceTTC(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatRate">Taux TVA (%)</Label>
              <Input id="vatRate" type="number" value={vatRate} onChange={(e: ChangeEvent<HTMLInputElement>) => setVatRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portions">Nombre de portions</Label>
              <Input id="portions" type="number" value={portions} onChange={(e: ChangeEvent<HTMLInputElement>) => setPortions(Number(e.target.value))} min="1"/>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg bg-secondary">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Prix HT</div>
              <div className="font-bold text-lg text-foreground">{formatCurrency(priceHT)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Coût Portion</div>
              <div className="font-bold text-lg text-foreground">{formatCurrency(costPerPortion)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Marge Unitaire</div>
              <div className="font-bold text-lg text-green-600">{formatCurrency(unitMargin)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Ratio Coût</div>
              <div className="font-bold text-lg text-foreground">{costPercentage.toFixed(1)}%</div>
            </div>
             <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Coût Recette</div>
              <div className="font-bold text-lg text-primary">{formatCurrency(totalIngredientCost)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ingrédients & Coûts</CardTitle>
            <CardDescription>Ajoutez les ingrédients pour calculer le coût de la recette.</CardDescription>
          </div>
          <Button type="button" onClick={handleAddIngredient}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un ingrédient
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Ingrédient</TableHead>
                  <TableHead className="w-[120px]">Quantité</TableHead>
                  <TableHead className="w-[120px]">Unité (Util.)</TableHead>
                  <TableHead className="text-right">Coût Total</TableHead>
                  <TableHead className="text-center w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => (
                  <TableRow key={ing.id}>
                    <TableCell>
                       <Select 
                          value={ing.stockId} 
                          onValueChange={(value) => handleSelectIngredient(ing.id, value)}
                        >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un ingrédient..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(ing.id, "quantity", Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                       <Input
                        type="text"
                        value={ing.unitUse}
                        onChange={(e) => handleIngredientChange(ing.id, "unitUse", e.target.value)}
                        placeholder="g, ml, pièce..."
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateIngredientCost(ing))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(ing.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {ingredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      Aucun ingrédient ajouté.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4 p-4 rounded-lg bg-muted">
            <div className="text-right">
              <div className="text-lg font-semibold text-muted-foreground">Coût Total des Ingrédients</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalIngredientCost)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Procédure</CardTitle>
          <CardDescription>Décrivez les étapes de préparation, cuisson et service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preparation">Préparation</Label>
            <Textarea id="preparation" value={preparation} onChange={(e) => setPreparation(e.target.value)} placeholder="Étapes de préparation..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cooking">Cuisson</Label>
            <Textarea id="cooking" value={cooking} onChange={(e) => setCooking(e.target.value)} placeholder="Instructions de cuisson..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Service / Dressage</Label>
            <Textarea id="service" value={service} onChange={(e) => setService(e.target.value)} placeholder="Instructions de dressage..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Allergènes & Régimes Spéciaux</CardTitle>
            <CardDescription>Listez les allergènes présents et les régimes compatibles.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-2 mb-4">
                <Input 
                    value={allergenInput} 
                    onChange={(e) => setAllergenInput(e.target.value)}
                    onKeyDown={handleAllergenKeyDown}
                    placeholder="Ajouter un allergène (ex: Gluten, Lactose...)"
                />
                 <Button type="button" onClick={handleAddAllergen}>Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {allergens.map(allergen => (
                    <Badge key={allergen} variant="secondary" className="text-base py-1 px-3">
                        {allergen}
                        <button type="button" onClick={() => handleRemoveAllergen(allergen)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
            <CardTitle>Argumentation Commerciale</CardTitle>
            <CardDescription>Rédigez un texte pour aider le personnel de salle à vendre ce plat.</CardDescription>
        </CardHeader>
        <CardContent>
             <Textarea value={salesPitch} onChange={(e) => setSalesPitch(e.target.value)} placeholder="Ex: Un plat généreux et réconfortant, parfait avec notre vin rouge maison..." rows={4}/>
        </CardContent>
      </Card>
      
       <div className="flex justify-end mt-8">
        <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-5 w-5" />
            Sauvegarder les modifications
        </Button>
      </div>
    </form>
  );
}
