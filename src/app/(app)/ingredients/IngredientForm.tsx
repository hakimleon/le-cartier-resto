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

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  category: z.string().min(2, "La catégorie est requise."),
  stockQuantity: z.coerce.number().min(0, "La quantité en stock ne peut pas être négative."),
  unitPurchase: z.string().min(1, "L'unité d'achat est requise (ex: kg, litre, pièce)."),
  lowStockThreshold: z.coerce.number().min(0, "Le seuil de stock bas ne peut pas être négatif."),
  unitPrice: z.coerce.number().positive("Le prix unitaire doit être un nombre positif."),
  supplier: z.string().optional(),
});

type IngredientFormProps = {
  ingredient: Ingredient | null;
  onSuccess: () => void;
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const ingredientToSave: Omit<Ingredient, 'id'> = {
        ...values,
        supplier: values.supplier || "", // Ensure supplier is always a string
      };

      await saveIngredient(ingredientToSave, ingredient?.id || null);
      
      toast({
        title: "Succès",
        description: `L'ingrédient "${values.name}" a été sauvegardé.`,
      });
      onSuccess();
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <FormLabel>Catégorie</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Épicerie sèche" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Prix unitaire (DZD)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 150.50" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                    <Input placeholder="Ex: Fournisseur ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" disabled={isSubmitting} className="mt-6">
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </Form>
  );
}
