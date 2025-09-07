
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ingredient } from "@/lib/types";
import { saveIngredient } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const ingredientCategories = [
    { name: "Viandes & Gibiers", examples: "Bœuf, Veau, Agneau, Porc, Gibier..." },
    { name: "Volaille", examples: "Poulet entier, Cuisses, Filets, Ailes, Foies..." },
    { name: "Charcuterie & Produits carnés transformés", examples: "Bacon, Chorizo, Jambon, Saucisses, Lardons..." },
    { name: "Poissons", examples: "Saumon, Cabillaud, Thon, Sardines..." },
    { name: "Fruits de mer & Crustacés", examples: "Crevettes, Moules, Huîtres, Calamars..." },
    { name: "Légumes & Champignons", examples: "Carottes, Pommes de terre, Salades, Champignons..." },
    { name: "Fruits frais", examples: "Citrons, Pommes, Bananes, Fraises..." },
    { name: "Produits laitiers & Œufs", examples: "Lait, Crème, Beurre, Yaourts, Œufs..." },
    { name: "Fromages", examples: "Mozzarella, Comté, Roquefort, Ricotta..." },
    { name: "Épicerie sèche & Céréales", examples: "Pâtes, Riz, Farine, Sucre, Lentilles..." },
    { name: "Épices, Herbes & Aromates", examples: "Sel, Poivre, Curry, Basilic, Thym..." },
    { name: "Huiles, Vinaigres & Condiments", examples: "Huile d'olive, Vinaigre, Moutarde, Olives..." },
    { name: "Produits de boulangerie", examples: "Pain, Baguette, Burger buns, Viennoiseries..." },
    { name: "Produits de pâtisserie & Fruits secs", examples: "Chocolat, Amandes, Noisettes, Cacao..." },
    { name: "Boissons non alcoolisées", examples: "Eau, Jus de fruits, Sodas..." },
    { name: "Produits surgelés", examples: "Légumes surgelés, Frites, Poissons surgelés..." },
    { name: "Produits transformés", examples: "Fonds de sauce, Bouillons cubes, Sauces prêtes..." },
    { name: "Autre", examples: "Tout ingrédient qui n'entre pas dans les autres catégories." },
];

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie."}).min(1, "La catégorie est requise."),
  stockQuantity: z.coerce.number().min(0, "La quantité en stock ne peut pas être négative."),
  unitPurchase: z.string().min(1, "L'unité d'achat est requise (ex: kg, litre, pièce)."),
  lowStockThreshold: z.coerce.number().min(0, "Le seuil de stock bas ne peut pas être négatif."),
  unitPrice: z.coerce.number().positive("Le prix unitaire doit être un nombre positif."),
  supplier: z.string().optional(),
});

type IngredientFormProps = {
  ingredient: Partial<Ingredient> | null;
  onSuccess: (newIngredient?: Ingredient) => void;
};

export function IngredientForm({ ingredient, onSuccess }: IngredientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ingredient?.name || "",
      category: ingredient?.category || "",
      stockQuantity: ingredient?.stockQuantity || 0,
      unitPurchase: ingredient?.unitPurchase || "",
      lowStockThreshold: ingredient?.lowStockThreshold || 0,
      unitPrice: ingredient?.unitPrice || 0,
      supplier: ingredient?.supplier || "",
    },
  });

  const selectedCategory = form.watch("category");
  const categoryExamples = ingredientCategories.find(c => c.name === selectedCategory)?.examples;


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const ingredientToSave: Omit<Ingredient, 'id'> = {
        ...values,
        supplier: values.supplier || "", // Ensure supplier is always a string
      };

      const savedIngredient = await saveIngredient(ingredientToSave, ingredient?.id || null);
      
      toast({
        title: "Succès",
        description: `L'ingrédient "${values.name}" a été sauvegardé.`,
      });
      onSuccess(savedIngredient);
    } catch (error) {
      console.error("Error saving ingredient:", error);
      toast({
        title: "Erreur",
        description: "La sauvegarde de l'ingrédient a échoué.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'ingrédient</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Farine de blé T55" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
                <div className="flex items-center gap-2">
                    <FormLabel>Catégorie</FormLabel>
                    {categoryExamples && (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{categoryExamples}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une catégorie..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {ingredientCategories.map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Quantité en stock</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 25" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="unitPurchase"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Unité</FormLabel>
                    <FormControl>
                    <Input placeholder="Ex: kg, l, pièce" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Seuil de stock bas</FormLabel>
                    <FormControl>
                    <Input type="number" step="1" placeholder="Ex: 5" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Prix unitaire (DZD)</FormLabel>
                    <FormControl>
                    <Input type="number" step="1" placeholder="Ex: 150" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Fournisseur (Optionnel)</FormLabel>
                <FormControl>
                <Input placeholder="Ex: Fournisseur ABC" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder l'ingrédient"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    