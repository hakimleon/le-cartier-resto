

"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Ingredient, suppliers } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type IngredientFormProps = {
  ingredient: Ingredient | null;
  onSave: (ingredient: Ingredient) => void;
  onCancel: () => void;
};

const emptyIngredient: Omit<Ingredient, 'id'> = {
  name: "",
  category: "",
  unitPrice: 0,
  unitPurchase: "kg",
  stockQuantity: 0,
  supplier: "",
  lowStockThreshold: 10,
};

const units = ["kg", "g", "L", "ml", "pièce", "botte", "boîte"];
const categories = [
    "Fruits", "Fruits secs", "Légumes", "Herbes aromatiques", "Épices",
    "Viandes et volailles", "Poissons et fruits de mer", "Produits laitiers",
    "Fromages", "Œufs", "Céréales", "Boulangerie", "Desserts", "Boissons",
    "Condiments", "Huiles"
];

export function IngredientForm({ ingredient, onSave, onCancel }: IngredientFormProps) {
  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>(ingredient || emptyIngredient);

  useEffect(() => {
    setFormData(ingredient || emptyIngredient);
  }, [ingredient]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData: Ingredient = {
      ...formData,
      id: ingredient?.id || `new-${Date.now()}`
    };
    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l'ingrédient</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitPurchase">Unité d'achat</Label>
          <Select name="unitPurchase" value={formData.unitPurchase} onValueChange={(value) => handleSelectChange('unitPurchase', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Prix/Unité (DZD)</Label>
          <Input id="unitPrice" name="unitPrice" type="number" value={formData.unitPrice} onChange={handleChange} step="0.1" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
          <SelectTrigger><SelectValue placeholder="Choisir une catégorie..." /></SelectTrigger>
          <SelectContent>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Fournisseur</Label>
        <Select name="supplier" value={formData.supplier} onValueChange={(value) => handleSelectChange('supplier', value)}>
          <SelectTrigger><SelectValue placeholder="Choisir un fournisseur..." /></SelectTrigger>
          <SelectContent>
            {Object.values(suppliers).map(sup => <SelectItem key={sup} value={sup}>{sup}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {ingredient ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}

    