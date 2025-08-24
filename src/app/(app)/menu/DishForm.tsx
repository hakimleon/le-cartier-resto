

"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Recipe, categories, tags as availableTags } from "@/data/definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type DishFormProps = {
  dish: Recipe | null;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  isSaving: boolean;
};

const emptyDish: Omit<Recipe, 'id'> = {
  name: "",
  description: "",
  category: categories[0],
  price: 0,
  cost: 0,
  prepTime: 0,
  status: "Inactif",
  tags: [],
  image: "",
  imageHint: "",
  procedure: { preparation: [], cuisson: [], service: [] },
  difficulty: 1,
  allergens: [],
};

export function DishForm({ dish, onSave, onCancel, isSaving }: DishFormProps) {
  const [formData, setFormData] = useState<Omit<Recipe, 'id'>>(dish || emptyDish);
  const [imagePreview, setImagePreview] = useState<string | null>(dish?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    setFormData(dish || emptyDish);
    setImagePreview(dish?.image || null);
    setImageFile(null);
  }, [dish]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagClick = (tag: typeof availableTags[number]) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const submissionData = new FormData(formEl);

    // Append non-input fields manually
    submissionData.append('id', dish?.id || '');
    submissionData.append('status', formData.status);
    submissionData.append('difficulty', String(formData.difficulty));
    submissionData.append('tags', JSON.stringify(formData.tags));
    submissionData.append('image', formData.image); // The existing image URL

    if (imageFile) {
        submissionData.append('imageFile', imageFile);
    }
    
    onSave(submissionData);
  };
  
  const difficultyLevels = [
    { value: 1, label: "Facile" },
    { value: 2, label: "Moyen" },
    { value: 3, label: "Difficile" },
    { value: 4, label: "Expert" },
    { value: 5, label: "Chef" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="h-[70vh]">
        <div className="p-6 space-y-6">
          
          <div className="space-y-2">
            <Label>Image du plat</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-border/50 rounded-md flex items-center justify-center bg-background/50 overflow-hidden relative">
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="Aperçu" width={96} height={96} className="object-cover" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, image: "" }));
                        setImageFile(null);
                    }}>
                        <ImageIcon className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <Button type="button" asChild variant="outline">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="mr-2" /> Télécharger une image
                </Label>
              </Button>
              <Input id="image-upload" name="imageFile" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du plat *</Label>
              <Input id="name" name="name" defaultValue={formData.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select name="category" defaultValue={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={formData.description} rows={3} />
          </div>

           <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                 const isSelected = formData.tags.includes(tag);
                 return (
                    <Badge 
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        variant="outline"
                        className={cn("cursor-pointer border-border/20", {
                            "bg-primary/10 text-primary border-primary/20": isSelected,
                        })}
                    >
                        {tag}
                    </Badge>
                 )
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (€) *</Label>
              <Input id="price" name="price" type="number" defaultValue={formData.price} step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepTime">Temps de préparation (min) *</Label>
              <Input id="prepTime" name="prepTime" type="number" defaultValue={formData.prepTime} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulté *</Label>
              <Select defaultValue={String(formData.difficulty)} onValueChange={(value) => handleSelectChange('difficulty', parseInt(value))}>
                <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map(level => <SelectItem key={level.value} value={String(level.value)}>{level.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
             <Switch 
                id="status" 
                checked={formData.status === "Actif"} 
                onCheckedChange={(checked) => handleSelectChange('status', checked ? 'Actif' : 'Inactif')}
                />
            <Label htmlFor="status">Plat disponible</Label>
          </div>

        </div>
      </ScrollArea>
      <div className="flex justify-end gap-2 p-4 border-t border-border/20">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Annuler</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
          {isSaving ? "Sauvegarde en cours..." : (dish ? "Mettre à jour" : "Ajouter le plat")}
        </Button>
      </div>
    </form>
  );
}
