
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  baseUnit: z.enum(['g', 'ml']),
  equivalences: z.array(z.object({
    key: z.string().min(1, "Clé requise"),
    value: z.string().min(1, "Valeur requise"),
  })).optional(),
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
      baseUnit: ingredient?.baseUnit || 'g',
      equivalences: ingredient?.equivalences 
        ? Object.entries(ingredient.equivalences).map(([key, value]) => ({ key, value: String(value) })) 
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equivalences",
  });

  const selectedCategory = form.watch("category");
  const purchaseUnit = form.watch("purchaseUnit");
  
  const getDynamicLabel = (field: 'purchaseWeightGrams') => {
    const unit = purchaseUnit?.toLowerCase();
    if (field === 'purchaseWeightGrams') {
        if (unit === 'pièce' || unit === 'unité') return { label: "Poids moyen par pièce (g)", desc: "Pour 1 pièce achetée." };
        if (unit === 'botte') return { label: "Poids moyen par botte (g)", desc: "Pour 1 botte achetée." };
        if (unit === 'l' || unit === 'litre' || unit === 'litres' || unit === 'cl' || unit === 'ml') return { label: "Volume équivalent (ml)", desc: `Pour 1 ${unit} acheté.` };
        return { label: `Poids équivalent (g)`, desc: `Pour 1 ${unit} acheté.` };
    }
    return { label: "Label", desc: "Description" };
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const equivalencesAsRecord = values.equivalences?.reduce((acc, { key, value }) => {
        const numValue = parseFloat(value);
        acc[key] = isNaN(numValue) ? value : numValue;
        return acc;
      }, {} as Record<string, string | number>);
      
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
        baseUnit: values.baseUnit,
        equivalences: equivalencesAsRecord,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-8">
            
            <div>
              <h3 className="text-lg font-medium mb-4">Informations Générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nom de l'ingrédient</FormLabel> <FormControl> <Input placeholder="Ex: Beurre doux AOP" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger><SelectValue placeholder="Sélectionnez une catégorie..." /></SelectTrigger>
                              <SelectContent> {ingredientCategories.map(cat => ( <SelectItem key={cat.name} value={cat.name}> {cat.name} </SelectItem> ))} </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="supplier" render={({ field }) => ( <FormItem> <FormLabel>Fournisseur (Optionnel)</FormLabel> <FormControl> <Input placeholder="Ex: Fournisseur ABC" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="baseUnit" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unité de Base</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="g">g (grammes)</SelectItem><SelectItem value="ml">ml (millilitres)</SelectItem></SelectContent>
                            </Select>
                            <FormDescription className="text-xs">Unité de référence pour les calculs de coût.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>
              </div>
            </div>
            
            <Separator />

            <div>
                <h3 className="text-lg font-medium mb-4">Détails d'Achat & Coût</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField control={form.control} name="purchasePrice" render={({ field }) => ( <FormItem> <FormLabel>Prix d'achat (DZD)</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="Ex: 150" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Unité d'achat</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
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
                    <FormField control={form.control} name="purchaseWeightGrams" render={({ field }) => ( <FormItem> <FormLabel>{getDynamicLabel('purchaseWeightGrams').label}</FormLabel> <FormControl> <Input type="number" step="1" placeholder="Ex: 1000" {...field} /> </FormControl> <FormDescription className="text-xs">{getDynamicLabel('purchaseWeightGrams').desc}</FormDescription> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="yieldPercentage" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rendement (%)</FormLabel>
                        <FormControl><Input type="number" step="1" placeholder="Ex: 80" {...field} /></FormControl>
                        <FormDescription className="text-xs">% utilisable après parage.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </div>

            <Separator />
            
             <div>
                <h3 className="text-lg font-medium">Table d'équivalence</h3>
                <p className="text-sm text-muted-foreground">Définissez ici les conversions spécifiques (ex: "pièce->g").</p>
                <div className="space-y-4 pt-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2">
                            <FormField control={form.control} name={`equivalences.${index}.key`} render={({ field }) => (
                                <FormItem className="flex-1">
                                    {index === 0 && <FormLabel>Conversion</FormLabel>}
                                    <FormControl><Input placeholder="ex: pièce->g" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name={`equivalences.${index}.value`} render={({ field }) => (
                                <FormItem className="flex-1">
                                    {index === 0 && <FormLabel>Valeur</FormLabel>}
                                    <FormControl><Input placeholder="ex: 120" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", value: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une conversion
                    </Button>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="text-lg font-medium mb-4">Gestion du Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField control={form.control} name="stockQuantity" render={({ field }) => ( <FormItem> <FormLabel>Stock actuel</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="Ex: 10" {...field} /> </FormControl> <FormDescription className="text-xs">En unité d'achat ({purchaseUnit}).</FormDescription> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="lowStockThreshold" render={({ field }) => ( <FormItem> <FormLabel>Seuil d'alerte</FormLabel> <FormControl> <Input type="number" step="1" placeholder="Ex: 2" {...field} /> </FormControl> <FormDescription className="text-xs">En unité d'achat ({purchaseUnit}).</FormDescription> <FormMessage /> </FormItem> )}/>
                </div>
            </div>

          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 border-t mt-auto shrink-0">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder l'ingrédient"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

