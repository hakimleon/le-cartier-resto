
"use client";

import { useState, useEffect } from "react";
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
import { Info, ChevronsUpDown, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


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
  purchaseWeightGrams: z.coerce.number().positive("Le poids de l'unité d'achat doit être positif."),
  yieldPercentage: z.coerce.number().min(0, "Le rendement doit être entre 0 et 100.").max(100, "Le rendement doit être entre 0 et 100."),
  isGeneric: z.boolean(),
  genericIngredientId: z.string().optional(),
}).refine(data => data.isGeneric || (!data.isGeneric && data.genericIngredientId), {
    message: "Un ingrédient non-générique doit être rattaché à un ingrédient générique.",
    path: ["genericIngredientId"],
});


type IngredientFormProps = {
  ingredient: Partial<Ingredient> | null;
  onSuccess: (newIngredient?: Ingredient) => void;
};

export function IngredientForm({ ingredient, onSuccess }: IngredientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genericIngredients, setGenericIngredients] = useState<Ingredient[]>([]);
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
      isGeneric: ingredient?.isGeneric ?? false,
      genericIngredientId: ingredient?.genericIngredientId || "",
    },
  });

  useEffect(() => {
    const fetchGenericIngredients = async () => {
        const q = query(collection(db, "ingredients"), where("isGeneric", "==", true));
        const querySnapshot = await getDocs(q);
        const generics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient));
        setGenericIngredients(generics);
    };
    fetchGenericIngredients();
  }, []);


  const selectedCategory = form.watch("category");
  const categoryExamples = ingredientCategories.find(c => c.name === selectedCategory)?.examples;
  const purchaseUnit = form.watch("purchaseUnit");
  const isGeneric = form.watch("isGeneric");

  const getWeightLabel = () => {
    switch (purchaseUnit?.toLowerCase()) {
      case 'pièce':
        return "Poids moyen d'une pièce (g)";
      case 'botte':
        return "Poids moyen d'une botte (g)";
      default:
        return "Poids de l'unité d'achat (g)";
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "purchaseUnit" && type === 'change') {
        const unit = value.purchaseUnit?.toLowerCase();
        if (unit === "kg" || unit === "l" || unit === "litre" || unit === "litres") {
          form.setValue('purchaseWeightGrams', 1000, { shouldValidate: true });
        } else if (unit === "g" || unit === "ml") {
          form.setValue('purchaseWeightGrams', 1, { shouldValidate: true });
        }
      }
      if (name === "isGeneric" && value.isGeneric) {
        form.setValue('genericIngredientId', undefined);
        form.clearErrors('genericIngredientId');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      
      const ingredientToSave: Omit<Ingredient, 'id'> = {
        ...values,
        supplier: values.supplier || "",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Colonne 1 */}
            <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'ingrédient</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Beurre doux AOP" {...field} />
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
                                        <TooltipContent className="max-w-xs">
                                            <p className="font-semibold mb-1">Exemples:</p>
                                            <p>{categoryExamples}</p>
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
            </div>
            
            {/* Colonne 2 */}
            <div className="space-y-6">
                <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Prix & Unité d'Achat</h4>
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
                            )}
                        />
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Poids & Rendement</h4>
                    <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="purchaseWeightGrams"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{getWeightLabel()}</FormLabel>
                                <FormControl>
                                <Input type="number" step="1" placeholder="Ex: 1000" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Pour 1 unité d'achat.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="yieldPercentage"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rendement (%)</FormLabel>
                                <div className="relative">
                                    <Input type="number" step="1" placeholder="Ex: 80" {...field} className="pr-8" />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                       %
                                    </div>
                                </div>
                                <FormDescription className="text-xs">
                                    % utilisable après parage.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Gestion des Variantes</h3>
            <FormField
              control={form.control}
              name="isGeneric"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Ceci est un ingrédient générique
                    </FormLabel>
                    <FormDescription>
                      Cochez si cet ingrédient est une catégorie (ex: "Beurre", "Huile d'olive"). Sinon, il sera traité comme une variante.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {!isGeneric && (
                 <FormField
                  control={form.control}
                  name="genericIngredientId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Rattacher à un ingrédient générique</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-[300px] justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? genericIngredients.find(
                                    (g) => g.id === field.value
                                  )?.name
                                : "Sélectionner un ingrédient générique"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher..." />
                            <CommandList>
                                <CommandEmpty>Aucun ingrédient générique trouvé.</CommandEmpty>
                                <CommandGroup>
                                {genericIngredients.map((g) => (
                                    <CommandItem
                                        value={g.name}
                                        key={g.id}
                                        onSelect={() => {
                                            form.setValue("genericIngredientId", g.id);
                                        }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        g.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                    />
                                    {g.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Liez cette variante (ex: "Beurre doux") à sa catégorie principale (ex: "Beurre").
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
        </div>

        <Separator />
        
        <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Gestion du Stock</h4>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stock actuel</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 10" {...field} />
                        </FormControl>
                         <FormDescription className="text-xs">
                            En unité d'achat.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Seuil d'alerte</FormLabel>
                        <FormControl>
                        <Input type="number" step="1" placeholder="Ex: 2" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                            En unité d'achat.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>

        <div className="md:col-span-2 flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder l'ingrédient"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
