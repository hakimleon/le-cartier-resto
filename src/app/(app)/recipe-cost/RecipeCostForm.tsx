"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { categories as menuCategories } from "@/data/mock-data";

interface Ingredient {
  id: number;
  category: string;
  name: string;
  unit: string;
  unitCost: number;
  quantity: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace("DZD", "").trim() + " DZD";
};

export function RecipeCostForm() {
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState(menuCategories[0]);
  const [priceTTC, setPriceTTC] = useState(0);
  const [vatRate, setVatRate] = useState(10);
  const [portions, setPortions] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now(), category: "", name: "", unit: "", unitCost: 0, quantity: 0 },
    ]);
  };

  const handleRemoveIngredient = (id: number) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };
  
  const handleIngredientChange = (id: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };
  
  const totalIngredientCost = useMemo(() => {
    return ingredients.reduce((total, ing) => total + ing.unitCost * ing.quantity, 0);
  }, [ingredients]);

  const { priceHT, costPerPortion, unitMargin, costPercentage } = useMemo(() => {
    const priceHT = priceTTC / (1 + vatRate / 100);
    const costPerPortion = portions > 0 ? totalIngredientCost / portions : 0;
    const unitMargin = priceHT - costPerPortion;
    const costPercentage = priceHT > 0 ? (costPerPortion / priceHT) * 100 : 0;
    return { priceHT, costPerPortion, unitMargin, costPercentage };
  }, [priceTTC, vatRate, portions, totalIngredientCost]);


  return (
    <div className="space-y-8">
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
            <div className="space-y-2">
              <Label htmlFor="portions">Nombre de portions</Label>
              <Input id="portions" type="number" value={portions} onChange={(e: ChangeEvent<HTMLInputElement>) => setPortions(Number(e.target.value))} min="1"/>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg bg-muted">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Prix HT</p>
              <p className="font-bold text-lg">{formatCurrency(priceHT)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Coût Portion</p>
              <p className="font-bold text-lg">{formatCurrency(costPerPortion)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Marge Unitaire</p>
              <p className="font-bold text-lg text-green-600">{formatCurrency(unitMargin)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Coût %</p>
              <p className="font-bold text-lg">{costPercentage.toFixed(1)}%</p>
            </div>
             <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Coût</p>
              <p className="font-bold text-lg">{formatCurrency(totalIngredientCost)}</p>
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
          <Button onClick={handleAddIngredient} className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2" />
            Ajouter un ingrédient
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Ingrédient</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Coût Unitaire (DZD)</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Coût Total</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell>
                     <Input
                        value={ing.category}
                        onChange={(e) => handleIngredientChange(ing.id, "category", e.target.value)}
                        placeholder="Ex: Légumes"
                      />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(ing.id, "name", e.target.value)}
                      placeholder="Ex: Tomate"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(ing.id, "unit", e.target.value)}
                      placeholder="Ex: kg"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={ing.unitCost}
                      onChange={(e) => handleIngredientChange(ing.id, "unitCost", Number(e.target.value))}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(ing.id, "quantity", Number(e.target.value))}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(ing.unitCost * ing.quantity)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(ing.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {ingredients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun ingrédient ajouté.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4 p-4 rounded-lg bg-orange-100">
            <div className="text-right">
              <p className="text-lg font-semibold">Grand Total</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalIngredientCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
