
"use client";

import { useState, useMemo, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Save, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { categories as menuCategories, Recipe, Ingredient as StockIngredient, conversions, RecipeIngredient } from "@/data/definitions";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface FormIngredient {
  id: number;
  stockId: string;
  name: string;
  category: string;
  unitUse: string;
  unitCost: number;
  unitPurchase: string;
  quantity: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace("DZD", "").trim() + " DZD";
};

const calculateIngredientCost = (ing: FormIngredient): number => {
    if (!ing.unitPurchase || !ing.unitUse || !ing.unitCost || !ing.quantity) {
        return 0;
    }
    
    if (ing.unitPurchase.toLowerCase() === ing.unitUse.toLowerCase()) {
        return ing.unitCost * ing.quantity;
    }

    const conversion = conversions.find(c => c.fromUnit.toLowerCase() === ing.unitPurchase.toLowerCase() && c.toUnit.toLowerCase() === ing.unitUse.toLowerCase());
    
    if (conversion) {
        const costPerUseUnit = ing.unitCost / conversion.factor;
        return costPerUseUnit * ing.quantity;
    }
    
    console.warn(`Aucune conversion trouvée pour: ${ing.unitPurchase} -> ${ing.unitUse}`);
    return 0;
};

type RecipeCostFormProps = {
  recipe: Recipe | null;
  recipes: Recipe[];
  ingredients: StockIngredient[];
  recipeIngredients: RecipeIngredient[];
};

export function RecipeCostForm({ recipe, recipes, ingredients: stockIngredients, recipeIngredients: allRecipeIngredients }: RecipeCostFormProps) {
  const { toast } = useToast();
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState(menuCategories[0]);
  const [priceTTC, setPriceTTC] = useState(0);
  const [vatRate, setVatRate] = useState(10);
  const [portions, setPortions] = useState(1);
  const [formIngredients, setFormIngredients] = useState<FormIngredient[]>([]);
  
  const [preparation, setPreparation] = useState("");
  const [cooking, setCooking] = useState("");
  const [service, setService] = useState("");
  
  const [openComboboxes, setOpenComboboxes] = useState<Record<number, boolean>>({});

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
            name: stockItem?.name || 'Ingrédient non trouvé',
            category: stockItem?.category || '',
            unitUse: ri.unitUse,
            unitCost: stockItem?.unitPrice || 0,
            unitPurchase: stockItem?.unitPurchase || '',
            quantity: ri.quantity || 0,
          }
        });

      setFormIngredients(relatedIngredients);
      if (recipe.procedure) {
        setPreparation(recipe.procedure.preparation.join('\n'));
        setCooking(recipe.procedure.cuisson.join('\n'));
        setService(recipe.procedure.service.join('\n'));
      }
    }
  }, [recipe, allRecipeIngredients, stockIngredients]);

  const handleAddIngredient = () => {
    setFormIngredients([
      ...formIngredients,
      { id: Date.now(), stockId: "", name: "", category: "", unitUse: "g", unitCost: 0, unitPurchase: 'kg', quantity: 0 },
    ]);
  };

  const handleRemoveIngredient = (id: number) => {
    setFormIngredients(formIngredients.filter((ing) => ing.id !== id));
  };
  
  const handleIngredientChange = (id: number, field: keyof FormIngredient, value: string | number) => {
    setFormIngredients((currentIngredients) =>
        currentIngredients.map((ing) =>
            ing.id === id ? { ...ing, [field]: value } : ing
        )
    );
  };
  
  const totalIngredientCost = useMemo(() => {
    return formIngredients.reduce((total, ing) => total + calculateIngredientCost(ing), 0);
  }, [formIngredients]);

  const { priceHT, costPerPortion, unitMargin, costPercentage } = useMemo(() => {
    const priceHT = priceTTC / (1 + vatRate / 100);
    const costPerPortion = portions > 0 ? totalIngredientCost / portions : 0;
    const unitMargin = priceHT - costPerPortion;
    const costPercentage = priceHT > 0 ? (costPerPortion / priceHT) * 100 : 0;
    return { priceHT, costPerPortion, unitMargin, costPercentage };
  }, [priceTTC, vatRate, portions, totalIngredientCost]);

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
              <Label htmlFor="priceTTC">Prix TTC (DZD)</Label>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg bg-muted/50">
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
              <div className="text-sm text-muted-foreground">Coût %</div>
              <div className="font-bold text-lg text-foreground">{costPercentage.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Coût</div>
              <div className="font-bold text-lg text-primary">{formatCurrency(totalIngredientCost)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingrédients & Coûts</CardTitle>
          <Button type="button" onClick={handleAddIngredient} className="bg-orange-500 hover:bg-orange-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un ingrédient
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Catégorie</TableHead>
                  <TableHead className="w-[250px]">Ingrédient</TableHead>
                  <TableHead className="w-[180px]">Unité Usage</TableHead>
                  <TableHead className="w-[150px]">Quantité</TableHead>
                  <TableHead className="text-right">Coût Total</TableHead>
                  <TableHead className="text-center w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formIngredients.map((ing) => (
                  <TableRow key={ing.id}>
                    <TableCell>
                      <Input value={ing.category} readOnly className="bg-muted/50 border-none" />
                    </TableCell>
                    <TableCell>
                      <Popover open={openComboboxes[ing.id]} onOpenChange={(open) => setOpenComboboxes(prev => ({...prev, [ing.id]: open}))}>
                          <PopoverTrigger asChild>
                              <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openComboboxes[ing.id]}
                                  className="w-full justify-between font-normal"
                              >
                                  {ing.name ? ing.name : "Sélectionner..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                              <Command>
                                  <CommandInput placeholder="Rechercher..." />
                                  <CommandList>
                                      <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                                      <CommandGroup>
                                          {stockIngredients.map((stockIng) => (
                                              <CommandItem
                                                  key={stockIng.id}
                                                  value={stockIng.name}
                                                  onSelect={(currentValue) => {
                                                    const selected = stockIngredients.find(
                                                      (item) => item.name.toLowerCase() === currentValue
                                                    );
                                                    if (selected) {
                                                      setFormIngredients((prev) =>
                                                        prev.map((item) =>
                                                          item.id === ing.id
                                                            ? {
                                                                ...item,
                                                                stockId: selected.id,
                                                                name: selected.name,
                                                                category: selected.category,
                                                                unitCost: selected.unitPrice,
                                                                unitPurchase: selected.unitPurchase,
                                                                unitUse: conversions.find(c => c.fromUnit.toLowerCase() === selected.unitPurchase.toLowerCase())?.toUnit || selected.unitPurchase,
                                                              }
                                                            : item
                                                        )
                                                      );
                                                    }
                                                    setOpenComboboxes(prev => ({...prev, [ing.id]: false}));
                                                  }}
                                              >
                                                  <Check
                                                      className={cn(
                                                          "mr-2 h-4 w-4",
                                                          ing.name.toLowerCase() === stockIng.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                                      )}
                                                  />
                                                  {stockIng.name}
                                              </CommandItem>
                                          ))}
                                      </CommandGroup>
                                  </CommandList>
                              </Command>
                          </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                       <Input
                        type="text"
                        value={ing.unitUse}
                        onChange={(e) => handleIngredientChange(ing.id, "unitUse", e.target.value)}
                        placeholder="g, ml, pièce..."
                      />
                    </TableCell>
                     <TableCell>
                      <Input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(ing.id, "quantity", Number(e.target.value))}
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
                {formIngredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      Aucun ingrédient ajouté.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4 p-4 rounded-lg bg-orange-100/50 border border-orange-200">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-muted-foreground">Grand Total</div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalIngredientCost)}</div>
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
      
       <div className="flex justify-end mt-8">
        <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-5 w-5" />
            Sauvegarder les modifications
        </Button>
      </div>
    </form>
  );
}
