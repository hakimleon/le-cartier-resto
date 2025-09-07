
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

const ingredientCategories = [
    { name: "Viandes & Gibiers", examples: "Bœuf (entrecôte, steak haché, jarret…), Veau (escalope, osso buco…), Agneau (côtelette, gigot…), Porc (filet mignon, travers, échine…), Gibier (chevreuil, sanglier – si utilisé)" },
    { name: "Volaille", examples: "Poulet entier, Cuisses, filets, ailes, pilons, Foies, abats" },
    { name: "Charcuterie & Produits carnés transformés", examples: "Bacon, Chorizo, Jambon cuit ou cru, Saucisses, lardons" },
    { name: "Poissons", examples: "Saumon (frais, fumé), Cabillaud, colin, Thon, Sardines" },
    { name: "Fruits de mer & Crustacés", examples: "Crevettes, Moules, Huîtres, Calamars, poulpe, Homard, langoustines" },
    { name: "Légumes & Champignons", examples: "Carottes, pommes de terre, oignons, Courgettes, aubergines, poivrons, Salades, tomates, Champignons de Paris, pleurotes" },
    { name: "Fruits frais", examples: "Citrons, oranges, Pommes, poires, Bananes, Fraises, framboises" },
    { name: "Produits laitiers & Œufs", examples: "Lait, crème, beurre, Yaourts, Œufs entiers, jaunes, blancs" },
    { name: "Fromages", examples: "Mozzarella, Comté, gruyère, emmental, Bleu, roquefort, Fromage frais (ricotta, mascarpone)" },
    { name: "Épicerie sèche & Céréales", examples: "Pâtes, riz, semoule, quinoa, Farine, sucre, levure boulangère, Lentilles, pois chiches, haricots secs" },
    { name: "Épices, Herbes & Aromates", examples: "Sel, poivre, Curry, paprika, cumin, Basilic, persil, coriandre, thym" },
    { name: "Huiles, Vinaigres & Condiments", examples: "Huile d’olive, huile de tournesol, Vinaigre balsamique, vinaigre de cidre, Moutarde, mayonnaise, ketchup, Olives, cornichons, câpres" },
    { name: "Produits de boulangerie", examples: "Pain (baguette, pain de mie, burger buns), Viennoiseries (croissant, brioche)" },
    { name: "Produits de pâtisserie & Fruits secs", examples: "Chocolat, Amandes, noisettes, pistaches, noix, Sucre glace, cacao en poudre, Levure chimique, gélatine" },
    { name: "Boissons non alcoolisées", examples: "Eau plate, eau gazeuse, Jus de fruits, Sodas" },
    { name: "Produits surgelés", examples: "Légumes surgelés, Frites, Poissons ou viandes surgelées" },
    { name: "Produits transformés", examples: "Fonds de sauce en poudre ou en brique, Bouillons cubes, Sauces toutes prêtes (barbecue, curry…)" },
    { name: "Divers / Autres", examples: "Tout ingrédient exceptionnel qui n’entre pas ailleurs (à limiter au maximum)" },
];


const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie."}).min(1, "La catégorie est requise."),
  stockQuantity: z.coerce.number().min(0, "La quantité en stock ne peut pas être négative."),
  lowStockThreshold: z.coerce.number().min(0, "Le seuil de stock bas ne peut pas être négatif."),
  supplier: z.string().optional(),
  // New fields for yield management
  purchasePrice: z.coerce.number().positive("Le prix d'achat doit être un nombre positif."),
  purchaseUnit: z.string().min(1, "L'unité d'achat est requise (ex: botte, kg, pièce)."),
  purchaseWeightGrams: z.coerce.number().positive("Le poids brut de l'unité d'achat doit être positif."),
  netWeightGrams: z.coerce.number().positive("Le poids net après parage doit être positif."),
}).refine(data => data.netWeightGrams <= data.purchaseWeightGrams, {
    message: "Le poids net ne peut pas être supérieur au poids brut.",
    path: ["netWeightGrams"],
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
      lowStockThreshold: ingredient?.lowStockThreshold || 0,
      supplier: ingredient?.supplier || "",
      purchasePrice: ingredient?.purchasePrice || 0,
      purchaseUnit: ingredient?.purchaseUnit || "",
      purchaseWeightGrams: ingredient?.purchaseWeightGrams || 0,
      netWeightGrams: ingredient?.netWeightGrams || 0,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'ingrédient</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Persil plat" {...field} />
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

        <div className="space-y-2 p-4 border rounded-md">
            <h4 className="font-medium text-sm">Prix & Rendement</h4>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Prix d'achat (DZD)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 150" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="purchaseUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unité d'achat</FormLabel>
                        <FormControl>
                        <Input placeholder="Ex: botte, kg, pièce" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4 pt-2">
                 <FormField
                    control={form.control}
                    name="purchaseWeightGrams"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Poids brut (g)</FormLabel>
                        <FormControl>
                        <Input type="number" step="1" placeholder="Ex: 250" {...field} />
                        </FormControl>
                         <FormDescription className="text-xs">
                            Poids de votre unité d'achat.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="netWeightGrams"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Poids net (g)</FormLabel>
                        <FormControl>
                        <Input type="number" step="1" placeholder="Ex: 180" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                            Poids après parage/épluchage.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>

        <div className="space-y-2 p-4 border rounded-md">
            <h4 className="font-medium text-sm">Gestion du Stock</h4>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stock actuel (en unité d'achat)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 10" {...field} />
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
                        <FormLabel>Seuil d'alerte stock bas</FormLabel>
                        <FormControl>
                        <Input type="number" step="1" placeholder="Ex: 2" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
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
