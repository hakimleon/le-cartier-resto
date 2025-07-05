// src/app/(app)/menu/DishForm.tsx
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { MenuItem, categories, tags as availableTags } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, PlusCircle, Upload, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

type DishFormProps = {
  dish: MenuItem | null;
  onSave: (dish: MenuItem) => void;
  onCancel: () => void;
};

const emptyDish: Omit<MenuItem, 'id'> = {
  name: "",
  description: "",
  category: categories[0],
  price: 0,
  prepTime: 0,
  status: "Actif",
  tags: [],
  image: "",
  imageHint: "",
  ingredients: [{ name: "", quantity: "" }],
  instructions: "",
  difficulty: 1,
  allergens: [],
};

export function DishForm({ dish, onSave, onCancel }: DishFormProps) {
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>(dish || emptyDish);
  const [imagePreview, setImagePreview] = useState<string | null>(dish?.image || null);

  useEffect(() => {
    setFormData(dish || emptyDish);
    setImagePreview(dish?.image || null);
  }, [dish]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (tag: typeof availableTags[number], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setFormData(prev => ({ ...prev, image: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: '', quantity: '' }] }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({ ...prev, ingredients: formData.ingredients.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData: MenuItem = {
      ...formData,
      id: dish?.id || `new-${Date.now()}`
    };
    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="h-[70vh]">
        <div className="p-6 pt-0">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Détails du Plat</TabsTrigger>
              <TabsTrigger value="recipe">Recette</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du plat</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Prix de vente (€)</Label>
                    <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image du plat</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted/50 overflow-hidden">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Aperçu" width={96} height={96} className="object-cover" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <Button type="button" asChild>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mr-2" /> Changer l'image
                    </Label>
                  </Button>
                  <Input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="recipe" className="mt-4 space-y-4">
               <div className="space-y-2">
                <Label>Ingrédients</Label>
                <div className="space-y-2">
                  {formData.ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input placeholder="Nom (ex: Tomate)" value={ing.name} onChange={(e) => handleIngredientChange(index, 'name', e.target.value)} />
                      <Input placeholder="Quantité (ex: 200g)" value={ing.quantity} onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)}><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}><PlusCircle className="mr-2"/>Ajouter un ingrédient</Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="instructions">Instructions de préparation</Label>
                <Textarea id="instructions" name="instructions" value={formData.instructions} onChange={handleChange} rows={6} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Temps de préparation (min)</Label>
                  <Input id="prepTime" name="prepTime" type="number" value={formData.prepTime} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Niveau de difficulté ({formData.difficulty})</Label>
                  <Slider
                    name="difficulty"
                    min={1} max={5} step={1}
                    value={[formData.difficulty]}
                    onValueChange={([value]) => handleSelectChange('difficulty', String(value))}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-4 space-y-6">
              <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                      <SelectItem value="Saisonnier">Saisonnier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-4">
                    {availableTags.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={formData.tags.includes(tag)}
                          onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="font-normal">{tag}</Label>
                      </div>
                    ))}
                  </div>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
      <div className="flex justify-end gap-2 p-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}
