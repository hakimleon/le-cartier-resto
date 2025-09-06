
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
import { generateRecipe } from "@/ai/flows/suggestion-flow";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  duration: z.coerce.number().int().positive("La durée doit être un nombre entier positif.").optional(),
  difficulty: z.enum(["Facile", "Moyen", "Difficile"], {
    errorMap: () => ({ message: "Veuillez sélectionner une difficulté valide." }),
  }),
  productionQuantity: z.coerce.number().positive("La quantité produite doit être positive."),
  productionUnit: z.string().min(1, "L'unité de production est requise (ex: kg, l, pièce)."),
  usageUnit: z.string().optional(),
});


type PreparationFormProps = {
  preparation: Partial<Preparation> | null;
  onSuccess: (newPreparation?: Preparation) => void;
};

export function PreparationForm({ preparation, onSuccess }: PreparationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: preparation ? {
        name: preparation.name || "",
        description: preparation.description || "",
        difficulty: preparation.difficulty || "Moyen",
        duration: preparation.duration || 10,
        productionQuantity: preparation.productionQuantity || 1,
        productionUnit: preparation.productionUnit || 'kg',
        usageUnit: preparation.usageUnit || '',
    } : {
        name: "",
        description: "",
        difficulty: "Moyen",
        duration: 10,
        productionQuantity: 1,
        productionUnit: 'kg',
        usageUnit: '',
    }
  });

  const handleGenerate = async () => {
      const name = form.getValues("name");
      const description = form.getValues("description");
      if (!name) {
          toast({
              title: "Nom manquant",
              description: "Veuillez entrer un nom pour la préparation avant d'utiliser l'IA.",
              variant: "destructive"
          });
          return;
      }
      setIsGenerating(true);
      try {
          const result = await generateRecipe({ name, description, type: 'Préparation' });
          if(result) {
              form.setValue("description", result.description || form.getValues("description"));
              form.setValue("duration", result.duration);
              form.setValue("difficulty", result.difficulty);
              form.setValue("productionQuantity", result.productionQuantity);
              form.setValue("productionUnit", result.productionUnit);
              form.setValue("usageUnit", result.usageUnit);
              toast({
                  title: "Suggestion de l'IA appliquée !",
                  description: "Les champs du formulaire ont été pré-remplis."
              })
          }
      } catch (e) {
          console.error("Failed to generate recipe with AI", e);
          toast({
              title: "Erreur de l'IA",
              description: "Impossible de générer la recette. Veuillez réessayer.",
              variant: 'destructive',
          });
      } finally {
          setIsGenerating(false);
      }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Ensure usageUnit is stored as an empty string if not provided
      const dataToSave = {
        ...values,
        usageUnit: values.usageUnit || ''
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
              <FormLabel>Nom</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="Ex: Sauce tomate maison" {...field} />
                </FormControl>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    title="Élaborer avec l'IA"
                >
                    <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                </Button>
              </div>
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
            <div className="grid grid-cols-2 gap-2">
                 <FormField
                    control={form.control}
                    name="productionUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unité Prod.</FormLabel>
                        <FormControl>
                            <Input placeholder="kg" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="usageUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unité Util.</FormLabel>
                        <FormControl>
                            <Input placeholder="g" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
