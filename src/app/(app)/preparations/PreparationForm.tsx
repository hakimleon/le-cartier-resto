
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().optional(),
});


type PreparationFormProps = {
  preparation: Partial<Preparation> | null;
  onSuccess: (newPreparation?: Preparation) => void;
};

export function PreparationForm({ preparation, onSuccess }: PreparationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: preparation?.name || "",
        description: preparation?.description || "",
    }
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Build a partial preparation object. The rest will be filled by the AI on the detail page.
      const dataToSave: Partial<Omit<Preparation, 'id'>> = {
        ...values,
      };

      const savedPreparation = await savePreparation(dataToSave, preparation?.id || null);
      
      toast({
        title: "Succès",
        description: `La préparation "${values.name}" a été sauvegardée.`,
      });
      onSuccess(savedPreparation);
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
              <FormLabel>Nom de la préparation</FormLabel>
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
              <FormLabel>Description (Optionnel)</FormLabel>
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
        
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder et continuer"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
