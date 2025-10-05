
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
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ingredientCategories = [
    { name: "Viandes & Gibiers", examples: "Bœuf (entrecôte, steak haché, joue), Agneau (carré, gigot), Porc (filet, échine, côte), Produits transformés : bacon, chorizo, jambon, saucisse" },
    { name: "Volaille", examples: "Poulet entier, Cuisse, aile, blanc, filet" },
    { name: "Poissons & Fruits de mer", examples: "Poissons frais : saumon, rouget, cabillaud, bar, dorade. Produits transformés : saumon fumé, morue salée, anchois marinés, surimi. Fruits de mer : crevettes, moules, calamars, huîtres" },
    { name: "Légumes frais", examples: "Carotte, courgette, aubergine, poivron, oignon, échalote, Ail, poireau, pomme de terre, brocoli, champignon" },
    { name: "Fruits frais", examples: "Citron, orange, pomme, poire, Fraise, framboise, raisin, mangue" },
    { name: "Herbes & Aromates frais", examples: "Persil, coriandre, basilic, ciboulette, menthe, Thym, romarin, laurier, estragon, aneth, sauge" },
    { name: "Produits laitiers & Fromages", examples: "Lait, crème, beurre, yaourt, Mozzarella, parmesan, fromage râpé, chèvre" },
    { name: "Épicerie sèche", examples: "Riz, pâtes, semoule, polenta, Farine, sucre, sel, Lentilles, pois chiches, haricots secs" },
    { name: "Huiles, Condiments & Vinaigres", examples: "Huiles : olive, tournesol, colza. Condiments : moutarde, mayonnaise, ketchup, sauce soja. Vinaigres : balsamique, vin rouge, cidre" },
    { name: "Épices & Assaisonnements secs", examples: "Poivre, paprika, curry, cumin, curcuma, Cannelle, girofle, noix de muscade" },
    { name: "Boulangerie & Pâtisserie", examples: "Pain, baguette, brioche, Pâte feuilletée, pâte brisée, Biscuits, levure, chocolat pâtissier" },
    { name: "Boissons (sans alcool)", examples: "Eau plate, eau gazeuse, Sodas (cola, limonade…), Jus de fruits (orange, pomme, ananas…)" },
    { name: "Autres / Divers", examples: "Décors alimentaires (perles de sucre, paillettes), Produits spécifiques (algues nori, fonds, fumets, gélatine…)" },
];


const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie."}).min(1, "La catégorie est requise."),
  stockQuantity: z.coerce.number().min(0, "La quantité en stock ne peut pas être négative."),
  lowStockThreshold: z.coerce.number().min(0, "Le seuil de stock bas ne peut pas être négatif."),
  supplier: z.string().optional(),
  purchasePrice: z.coerce.number().positive("Le prix d'achat doit être un nombre positif."),
  purchaseUnit: z.string().min(1, "L'unité d'achat est requise."),
  purchaseWeightGrams: z.coerce.number().positive("Le poids ou volume de l'unité d'achat doit être positif."),
  yieldPercentage: z.coerce.number().min(0, "Le rendement doit être entre 0 et 100.").max(100, "Le rendement doit être entre 0 et 100."),
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
      purchaseUnit: ingredient?.purchaseUnit || "kg",
      purchaseWeightGrams: ingredient?.purchaseWeightGrams || 1000,
      yieldPercentage: ingredient?.yieldPercentage || 100,
    },
  });

  const selectedCategory = form.watch("category");
  const categoryExamples = ingredientCategories.find(c => c.name === selectedCategory)?.examples;
  const purchaseUnit = form.watch("purchaseUnit");

  const getWeightLabel = () => {
    const unit = purchaseUnit?.toLowerCase();
    if (unit === 'pièce' || unit === 'unité') return "Poids moyen par pièce (g)";
    if (unit === 'botte') return "Poids moyen par botte (g)";
    if (unit === 'l' || unit === 'litre' || unit === 'litres' || unit === 'cl' || unit === 'ml') return "Volume équivalent (ml)";
    return "Poids équivalent (g)";
  };
  
  const getWeightDescription = () => {
    const unit = purchaseUnit?.toLowerCase();
    if (unit === 'pièce' || unit === 'unité' || unit === 'botte') return `Pour 1 ${unit}.`;
    return `Pour 1 ${unit} acheté.`;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      
      const ingredientToSave: Omit<Ingredient, 'id'> = {
        name: values.name,
        category: values.category,
        stockQuantity: values.stockQuantity,
        lowStockThreshold: values.lowStockThreshold,
        supplier: values.supplier || "",
        purchasePrice: values.purchasePrice,
        purchaseUnit: values.purchaseUnit,
        purchaseWeightGrams: values.purchaseWeightGrams,
        yieldPercentage: values.yieldPercentage,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nom de l'ingrédient</FormLabel> <FormControl> <Input placeholder="Ex: Beurre doux AOP" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="category" render={({ field }) => (
    <FormItem>
        <div className="flex items-center gap-2">
            <FormLabel>Catégorie</FormLabel>
            {categoryExamples && ( <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Info className="h-4 w-4 text-muted-foreground cursor-help" /> </TooltipTrigger> <TooltipContent className="max-w-xs"> <p className="font-semibold mb-1">Exemples:</p> <p>{categoryExamples}</p> </TooltipContent> </Tooltip> </TooltipProvider> )}
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
)}/>
                <FormField control={form.control} name="supplier" render={({ field }) => ( <FormItem> <FormLabel>Fournisseur (Optionnel)</FormLabel> <FormControl> <Input placeholder="Ex: Fournisseur ABC" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
            </div>
        </div>
        
        <Separator />

        <div className="space-y-6">
            <h3 className="text-lg font-medium">Prix, Unités & Rendement</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="purchasePrice" render={({ field }) => ( <FormItem> <FormLabel>Prix d'achat (DZD)</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="Ex: 150" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
    <FormItem>
        <FormLabel>Unité d'achat</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
            </FormControl>
            <SelectContent>
                <SelectItem value="kg">Kg</SelectItem>
                <SelectItem value="l">Litres</SelectItem>
                <SelectItem value="pièce">Pièce</SelectItem>
                <SelectItem value="botte">Botte</SelectItem>
                <SelectItem value="g">Grammes</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
            </SelectContent>
        </Select>
        <FormMessage />
    </FormItem>
)}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="purchaseWeightGrams" render={({ field }) => ( <FormItem> <FormLabel>{getWeightLabel()}</FormLabel> <FormControl> <Input type="number" step="1" placeholder="Ex: 50" {...field} /> </FormControl> <FormDescription className="text-xs">{getWeightDescription()}</FormDescription> <FormMessage /> </FormItem> )}/>
                <FormField
                  control={form.control}
                  name="yieldPercentage"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rendement (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="Ex: 80" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">% utilisable après parage.</FormDescription>
                        <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </div>

        <Separator />
        
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Gestion du Stock</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="stockQuantity" render={({ field }) => ( <FormItem> <FormLabel>Stock actuel</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="Ex: 10" {...field} /> </FormControl> <FormDescription className="text-xs">En unité d'achat.</FormDescription> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="lowStockThreshold" render={({ field }) => ( <FormItem> <FormLabel>Seuil d'alerte</FormLabel> <FormControl> <Input type="number" step="1" placeholder="Ex: 2" {...field} /> </FormControl> <FormDescription className="text-xs">En unité d'achat.</FormDescription> <FormMessage /> </FormItem> )}/>
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder l'ingrédient"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    