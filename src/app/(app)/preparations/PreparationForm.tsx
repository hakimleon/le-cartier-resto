
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Preparation } from "@/lib/types";
import { savePreparation } from "./actions";
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
  duration: z.coerce.number().int().positive("La durée doit être un nombre entier positif.").optional(),
  difficulty: z.enum(["Facile", "Moyen", "Difficile"], {
    errorMap: () => ({ message: "Veuillez sélectionner une difficulté valide." }),
  }),
  productionUnit: z.string().min(1, "L'unité de production est requise (ex: kg, l, pièce)."),
  productionQuantity: z.coerce.number().positive("La quantité produite doit être positive."),
});


type PreparationFormProps = {
  preparation: Preparation | null;
  onSuccess: () => void;
};

export function PreparationForm({ preparation, onSuccess }: PreparationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: preparation ? {
        name: preparation.name,
        description: preparation.description,
        difficulty: preparation.difficulty || "Moyen",
        duration: preparation.duration || 10,
        productionUnit: preparation.productionUnit || 'kg',
        productionQuantity: preparation.productionQuantity || 1,
    } : {
        name: "",
        description: "",
        difficulty: "Moyen",
        duration: 10,
        productionUnit: 'kg',
        productionQuantity: 1,
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await savePreparation(values, preparation?.id || null);
      
      toast({
        title: "Succès",
        description: `La préparation "${values.name}" a été sauvegardée.`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving preparation:", error);
      toast({
        title: "Erreur",
        description: `La sauvegarde de la préparation a échoué.`,
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
                <Input placeholder="Ex: Sauce tomate maison" {...field} />
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
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </Form>
  );
}

