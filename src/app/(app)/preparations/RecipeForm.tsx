
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Recipe } from "@/lib/types";
import { saveDish } from "@/app/(app)/menu/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

// Base schema for both Plat and Préparation
const baseSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  duration: z.coerce.number().int().positive("La durée doit être un nombre entier positif.").optional(),
  difficulty: z.enum(["Facile", "Moyen", "Difficile"], {
    errorMap: () => ({ message: "Veuillez sélectionner une difficulté valide." }),
  }),
});

// Schema for a "Plat"
const platSchema = baseSchema.extend({
    type: z.literal('Plat'),
    price: z.coerce.number().positive("Le prix doit être un nombre positif."),
    category: z.enum(["Entrées froides et chaudes", "Plats et Grillades", "Les mets de chez nous", "Symphonie de pâtes", "Nos Burgers Bistronomiques", "Dessert", "Élixirs & Rafraîchissements"], {
        errorMap: () => ({ message: "Veuillez sélectionner une catégorie valide." }),
    }),
    status: z.enum(["Actif", "Inactif"]),
});

// Schema for a "Préparation"
const preparationSchema = baseSchema.extend({
    type: z.literal('Préparation'),
    productionUnit: z.string().min(1, "L'unité de production est requise (ex: kg, l, pièce)."),
    productionQuantity: z.coerce.number().positive("La quantité produite doit être positive."),
});

// Discriminated union schema
const formSchema = z.discriminatedUnion("type", [platSchema, preparationSchema]);


type RecipeFormProps = {
  recipe: Recipe | null;
  type: 'Plat' | 'Préparation';
  onSuccess: () => void;
};

export function RecipeForm({ recipe, type, onSuccess }: RecipeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // @ts-ignore
    defaultValues: recipe ? {
        name: recipe.name,
        description: recipe.description,
        difficulty: recipe.difficulty || "Moyen",
        duration: recipe.duration || 10,
        type: recipe.type,
        ...(recipe.type === 'Plat' ? {
            price: recipe.price || 0,
            category: recipe.category,
            status: recipe.status || "Actif",
        } : {
            productionUnit: recipe.productionUnit || 'kg',
            productionQuantity: recipe.productionQuantity || 1,
        })
    } : {
        type: type,
        name: "",
        description: "",
        difficulty: "Moyen",
        duration: 10,
        ...(type === 'Plat' ? {
            price: 0,
            category: "Plats et Grillades",
            status: "Actif",
        } : {
            productionUnit: 'kg',
            productionQuantity: 1,
        })
    }
  });
  
  const currentType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // @ts-ignore
      await saveDish(values, recipe?.id || null);
      
      toast({
        title: "Succès",
        description: `La ${currentType.toLowerCase()} "${values.name}" a été sauvegardée.`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({
        title: "Erreur",
        description: `La sauvegarde de la ${currentType.toLowerCase()} a échoué.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder={currentType === 'Plat' ? "Ex: Soupe à l'oignon" : "Ex: Sauce tomate maison"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Une délicieuse base pour vos plats..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fields for "Plat" type */}
        {currentType === 'Plat' && (
            <>
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Prix (€)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 12.50" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Entrées froides et chaudes">Entrées froides et chaudes</SelectItem>
                            <SelectItem value="Plats et Grillades">Plats et Grillades</SelectItem>
                            <SelectItem value="Les mets de chez nous">Les mets de chez nous</SelectItem>
                            <SelectItem value="Symphonie de pâtes">Symphonie de pâtes</SelectItem>
                            <SelectItem value="Nos Burgers Bistronomiques">Nos Burgers Bistronomiques</SelectItem>
                            <SelectItem value="Dessert">Dessert</SelectItem>
                            <SelectItem value="Élixirs & Rafraîchissements">Élixirs & Rafraîchissements</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
            </>
        )}

        {/* Fields for "Préparation" type */}
        {currentType === 'Préparation' && (
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="productionQuantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Quantité Produite</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.1" placeholder="Ex: 5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="productionUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unité de Production</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: kg, l, pièce" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Durée (min)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="Ex: 30" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Difficulté</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un niveau" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Facile">Facile</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="Difficile">Difficile</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        {currentType === 'Plat' && (
            <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Statut</FormLabel>
                    <FormDescription>
                    Rendre ce plat visible ou non sur le menu.
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value === 'Actif'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'Actif' : 'Inactif')}
                    />
                </FormControl>
                </FormItem>
            )}
            />
        )}
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </Form>
  );
}
