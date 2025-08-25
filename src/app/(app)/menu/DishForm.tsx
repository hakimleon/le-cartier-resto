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

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  price: z.coerce.number().positive("Le prix doit être un nombre positif."),
  category: z.enum(["Entrées froides et chaudes", "Plats", "Les mets de chez nous", "Symphonie de pâtes", "Humburgers", "Dessert"]),
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const recipeToSave: Omit<Recipe, 'id'> = {
        ...values
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix</FormLabel>
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
                  <SelectItem value="Humburgers">Humburgers</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
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
