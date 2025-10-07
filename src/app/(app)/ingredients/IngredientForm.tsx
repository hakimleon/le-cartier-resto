
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ingredientCategories = [
    "Viandes & Gibiers", "Volaille", "Poissons & Fruits de mer", "Légumes frais", "Fruits frais", 
    "Herbes & Aromates frais", "Produits laitiers & Fromages", "Épicerie sèche", "Huiles, Condiments & Vinaigres", 
    "Épices & Assaisonnements secs", "Boulangerie & Pâtisserie", "Boissons (sans alcool)", "Autres / Divers"
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
  
  const purchaseUnit = form.watch("purchaseUnit");
  const getDynamicLabel = () => {
    const unit = purchaseUnit?.toLowerCase();
    if (unit === 'pièce' || unit === 'unité') return "Poids moyen par pièce (g)";
    if (unit === 'botte') return "Poids moyen par botte (g)";
    if (unit === 'l' || unit === 'litre' || unit === 'litres' || unit === 'cl' || unit === 'ml') return "Volume équivalent (ml)";
    return `Poids équivalent (g)`;
  };
  const getDynamicDescription = () => {
      const unit = purchaseUnit || 'kg';
      return `Pour 1 ${unit} acheté(e).`;
  }

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="main">Informations Principales</TabsTrigger>
                <TabsTrigger value="equivalences">Table d'équivalence</TabsTrigger>
            </TabsList>
            
            <TabsContent value="main" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nom de l'ingrédient</FormLabel> <FormControl> <Input placeholder="Ex: Beurre doux AOP" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catégorie</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Sélectionnez une catégorie..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent> {ingredientCategories.map(cat => ( <SelectItem key={cat} value={cat}> {cat} </SelectItem> ))} </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="supplier" render={({ field }) => ( <FormItem> <FormLabel>Fournisseur (Optionnel)</FormLabel> <FormControl> <Input placeholder="Ex: Fournisseur ABC" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                         <FormField control={form.control} name="baseUnit" render={({ field }) => (
                            <FormItem className="space-y-3 pt-2">
                                <FormLabel>Unité de base pour le coût</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-6">
                                        <FormItem className="flex items-center space-x-2 space-y-0"> <FormControl> <RadioGroupItem value="g" /> </FormControl> <FormLabel className="font-normal">g (grammes)</FormLabel> </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"> <FormControl> <RadioGroupItem value="ml" /> </FormControl> <FormLabel className="font-normal">ml (millilitres)</FormLabel> </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                 <FormDescription className="text-xs">Définit si le coût de revient est calculé par gramme ou par millilitre.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Détails d'Achat et Rendement</CardTitle>
                        <CardDescription>Informations utilisées pour calculer le coût de revient précis.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField control={form.control} name="purchasePrice" render={({ field }) => ( <FormItem> <FormLabel>Prix d'achat (DZD)</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="Ex: 150" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Unité d'achat</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
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
                        <FormField control={form.control} name="purchaseWeightGrams" render={({ field }) => ( <FormItem> <FormLabel>{getDynamicLabel()}</FormLabel> <FormControl> <Input type="number" step="1" placeholder="Ex: 1000" {...field} /> </FormControl> <FormDescription className="text-xs">{getDynamicDescription()}</FormDescription> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="yieldPercentage" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rendement (%)</FormLabel>
                            <FormControl><Input type="number" step="1" placeholder="Ex: 80" {...field} /></FormControl>
                            <FormDescription className="text-xs">% de produit utilisable après parage.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gestion du Stock</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                         <FormField control={form.control} name="stockQuantity" render={({ field }) => ( <FormItem> <FormLabel>Stock actuel</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="Ex: 10" {...field} /> </FormControl> <FormDescription className="text-xs">En unité d'achat ({purchaseUnit}).</FormDescription> <FormMessage /> </FormItem> )}/>
                         <FormField control={form.control} name="lowStockThreshold" render={({ field }) => ( <FormItem> <FormLabel>Seuil d'alerte</FormLabel> <FormControl> <Input type="number" step="1" placeholder="Ex: 2" {...field} /> </FormControl> <FormDescription className="text-xs">En unité d'achat ({purchaseUnit}).</FormDescription> <FormMessage /> </FormItem> )}/>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="equivalences" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Table d'équivalence</CardTitle>
                        <CardDescription>Définissez ici les conversions spécifiques pour cet ingrédient, par exemple "pièce" vers "g", ou "botte" vers "g".</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => append({ key: "", value: "" })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter une conversion
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder l'ingrédient"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    