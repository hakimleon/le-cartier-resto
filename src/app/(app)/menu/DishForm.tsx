
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Recipe, dishCategories } from "@/lib/types";
import { saveDish } from "./actions";
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

// Schema for a "Plat"
const formSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
    duration: z.coerce.number().int().positive("La durée doit être un nombre entier positif.").optional(),
    difficulty: z.enum(["Facile", "Moyen", "Difficile"], {
        errorMap: () => ({ message: "Veuillez sélectionner une difficulté valide." }),
    }),
    type: z.literal('Plat'),
    price: z.coerce.number().positive("Le prix doit être un nombre positif."),
    category: z.enum(dishCategories, { required_error: "Veuillez sélectionner une catégorie."}),
    status: z.enum(["Actif", "Inactif"]),
    portions: z.coerce.number().int().positive("Le nombre de portions doit être un entier positif."),
});

type DishFormProps = {
  dish: Recipe | null;
  onSuccess: () => void;
};

export function DishForm({ dish, onSuccess }: DishFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: dish ? {
        ...dish,
        difficulty: dish.difficulty || "Moyen",
        duration: dish.duration || 10,
    } : {
        type: 'Plat',
        name: "",
        description: "",
        difficulty: "Moyen",
        duration: 10,
        price: 0,
        category: "Plats et Grillades",
        status: "Actif",
        portions: 1,
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const dishToSave: Omit<Recipe, 'id'> = {
          ...values,
          tvaRate: 10, // Default TVA, can be changed later
      };
      
      await saveDish(dishToSave, dish?.id || null);
      
      toast({
        title: "Succès",
        description: `Le plat "${values.name}" a été sauvegardé.`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving dish:", error);
      toast({
        title: "Erreur",
        description: "La sauvegarde du plat a échoué.",
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
              <FormLabel>Nom du plat</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Soupe à l'oignon" {...field} />
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
                  placeholder="Ex: Une soupe réconfortante et gratinée."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Prix (DZD)</FormLabel>
                <FormControl>
                <Input type="number" step="1" placeholder="Ex: 1200" {...field} />
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
                    {dishCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        </div>

        <div className="grid grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="portions"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Portions</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="Ex: 1" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
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
        
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder le plat"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
