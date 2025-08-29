
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Recipe } from "@/lib/types";
import { saveDish } from "./actions";
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

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  price: z.coerce.number().positive("Le prix doit être un nombre positif."),
  category: z.enum(["Entrées froides et chaudes", "Plats", "Les mets de chez nous", "Symphonie de pâtes", "Nos Burgers Bistronomiques", "Dessert", "Élixirs & Rafraîchissements"], {
    errorMap: () => ({ message: "Veuillez sélectionner une catégorie valide." }),
  }),
  status: z.enum(["Actif", "Inactif"]),
  duration: z.coerce.number().int().positive("La durée doit être un nombre entier positif."),
  difficulty: z.enum(["Facile", "Moyen", "Difficile"], {
    errorMap: () => ({ message: "Veuillez sélectionner une difficulté valide." }),
  }),
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
    defaultValues: {
      name: dish?.name || "",
      description: dish?.description || "",
      price: dish?.price || 0,
      category: dish?.category || "Plats",
      status: dish?.status || "Actif",
      duration: dish?.duration || 25,
      difficulty: dish?.difficulty || "Moyen",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const recipeToSave: Omit<Recipe, 'id'> = {
        ...values,
      };

      await saveDish(recipeToSave, dish?.id || null);
      
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
                  placeholder="Ex: Une délicieuse soupe traditionnelle..."
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
                    <SelectItem value="Plats">Plats</SelectItem>
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
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </Form>
  );
}
