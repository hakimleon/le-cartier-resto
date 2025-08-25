
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChefHat, Euro, FilePen, FileText, Image as ImageIcon, Info, PlusCircle, Scale, Utensils } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type RecipeDetailClientProps = {
  recipeId: string;
};

const mockRecipe: Recipe = {
    id: "mock-id",
    name: "Filet de Boeuf Poêlé, Sauce au Poivre Vert",
    category: "Plats",
    description: "Un classique de la bistronomie française.",
    price: 32.00,
    portions: 10,
    tvaRate: 10,
    imageUrl: "https://picsum.photos/800/600",
    ingredientsList: [
        { id: "1", name: "Filet de boeuf", quantity: 2, unit: "kg", unitPrice: 45, totalCost: 90 },
        { id: "2", name: "Poivre vert", quantity: 50, unit: "g", unitPrice: 0.1, totalCost: 5 },
        { id: "3", name: "Crème fraîche", quantity: 0.5, unit: "l", unitPrice: 4, totalCost: 2 },
        { id: "4", name: "Cognac", quantity: 0.1, unit: "l", unitPrice: 20, totalCost: 2 },
        { id: "5", name: "Beurre", quantity: 100, unit: "g", unitPrice: 0.01, totalCost: 1 },
    ],
    procedure_preparation: "1. Parer le filet de boeuf.\n2. Concasser le poivre vert.\n3. Préparer les accompagnements.",
    procedure_cuisson: "1. Saisir le filet de boeuf dans une poêle chaude avec du beurre.\n2. Déglacer au cognac et flamber.\n3. Ajouter la crème et le poivre vert, laisser réduire.",
    procedure_service: "1. Trancher le filet de boeuf.\n2. Napper de sauce.\n3. Servir avec une purée de pommes de terre maison.",
    allergens: ["Lactose", "Sulfites"],
    commercialArgument: "Notre plat signature, préparé avec un filet de bœuf de première qualité et une sauce onctueuse qui ravira les palais les plus exigeants.",
    status: 'Actif',
    difficulty: 'Moyen',
    duration: 45,
};


export default function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipe() {
      if (!isFirebaseConfigured) {
        setError("La configuration de Firebase est manquante.");
        setIsLoading(false);
        return;
      }

      try {
        const recipeDocRef = doc(db, "recipes", recipeId);
        const recipeSnap = await getDoc(recipeDocRef);

        if (recipeSnap.exists()) {
          // Merge fetched data with mock data for fields that are not in Firestore yet
          const fetchedData = { ...recipeSnap.data(), id: recipeSnap.id } as Recipe;
          setRecipe({ ...mockRecipe, ...fetchedData, id: recipeId });
        } else {
          setError("Fiche technique non trouvée.");
        }
      } catch (e: any) {
        console.error("Error fetching recipe: ", e);
        setError("Impossible de charger la fiche technique. " + e.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipe();
  }, [recipeId]);

  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recipe) {
    return null;
  }
  
  const totalIngredientsCost = recipe.ingredientsList?.reduce((acc, item) => acc + item.totalCost, 0) || 0;
  const priceHT = recipe.price / (1 + (recipe.tvaRate || 0) / 100);
  const costPerPortion = totalIngredientsCost / (recipe.portions || 1);
  const marginPerPortion = priceHT - costPerPortion;
  const marginPercentage = priceHT > 0 ? (marginPerPortion / priceHT) * 100 : 0; // Marge sur Prix de Vente HT

  const getRatioColor = (ratio: number) => {
    if (ratio < 60) return "bg-red-500"; // Faible
    if (ratio < 75) return "bg-amber-500"; // Moyen
    return "bg-green-500"; // Bon
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary rounded-full h-14 w-14 flex items-center justify-center">
                <ChefHat className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
                <p className="text-muted-foreground">{recipe.category}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <FilePen className="mr-2 h-4 w-4"/>
                Modifier
            </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left & Center Column */}
        <div className="lg:col-span-2 space-y-8">
            {/* General & Costs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Général</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Vente TTC</p>
                                <p className="font-bold text-lg">{recipe.price.toFixed(2)}€</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">TVA</p>
                                <p className="font-bold text-lg">{recipe.tvaRate}%</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Portions</p>
                                <p className="font-bold text-lg">{recipe.portions}</p>
                            </div>
                        </div>
                   </div>
                   <div className="space-y-3">
                        <h4 className="font-semibold text-lg mb-2">Analyse de rentabilité</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Prix de vente HT</span>
                                <span className="font-semibold">{priceHT.toFixed(2)}€</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Coût portion</span>
                                <span className="font-semibold text-red-600">{costPerPortion.toFixed(2)}€</span>
                            </div>
                             <div className="flex justify-between items-center border-t pt-2 mt-1">
                                <span className="text-muted-foreground">Marge / Portion</span>
                                <span className="font-bold text-green-600">{marginPerPortion.toFixed(2)}€</span>
                            </div>
                        </div>
                        <div className="pt-2">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-sm text-muted-foreground">Ratio Marge / PV HT</span>
                             <span className={cn(
                                "font-bold text-lg",
                                getRatioColor(marginPercentage).replace('bg-', 'text-')
                             )}>{marginPercentage.toFixed(0)}%</span>
                           </div>
                           <Progress 
                             value={marginPercentage} 
                             className="h-3"
                             indicatorClassName={getRatioColor(marginPercentage)}
                            />
                        </div>
                   </div>
                </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Utensils className="h-5 w-5"/>Ingrédients</div>
                         <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Ajouter</Button>
                    </CardTitle>
                    <CardDescription>Liste des ingrédients nécessaires pour {recipe.portions} portions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ingrédient</TableHead>
                                <TableHead className="text-right">Quantité</TableHead>
                                <TableHead>Unité</TableHead>
                                <TableHead className="text-right">Coût unitaire</TableHead>
                                <TableHead className="text-right">Coût total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recipe.ingredientsList?.map(ing => (
                                <TableRow key={ing.id}>
                                    <TableCell className="font-medium">{ing.name}</TableCell>
                                    <TableCell className="text-right">{ing.quantity}</TableCell>
                                    <TableCell>{ing.unit}</TableCell>
                                    <TableCell className="text-right">{ing.unitPrice.toFixed(2)}€</TableCell>
                                    <TableCell className="text-right font-semibold">{ing.totalCost.toFixed(2)}€</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4">
                        <div className="text-right">
                            <p className="text-muted-foreground">Coût total ingrédients</p>
                            <p className="text-xl font-bold">{totalIngredientsCost.toFixed(2)}€</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {/* Procedure */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Procédure</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="preparation">
                        <TabsList>
                            <TabsTrigger value="preparation">Préparation</TabsTrigger>
                            <TabsTrigger value="cuisson">Cuisson</TabsTrigger>
                            <TabsTrigger value="service">Service</TabsTrigger>
                        </TabsList>
                        <TabsContent value="preparation" className="prose prose-sm max-w-none pt-4 whitespace-pre-wrap">
                            {recipe.procedure_preparation}
                        </TabsContent>
                        <TabsContent value="cuisson" className="prose prose-sm max-w-none pt-4 whitespace-pre-wrap">
                             {recipe.procedure_cuisson}
                        </TabsContent>
                        <TabsContent value="service" className="prose prose-sm max-w-none pt-4 whitespace-pre-wrap">
                             {recipe.procedure_service}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
            {/* Allergens */}
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600"/>Allergènes</div>
                         <Button variant="ghost" size="icon" className="h-8 w-8"><FilePen className="h-4 w-4"/></Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {recipe.allergens?.map(allergen => <Badge key={allergen} variant="secondary">{allergen}</Badge>)}
                </CardContent>
            </Card>
            {/* Commercial Argument */}
             <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5"/>Argumentaire Commercial</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                   <p>{recipe.commercialArgument}</p>
                </CardContent>
            </Card>

             {/* Photo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/>Photo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video relative w-full rounded-lg overflow-hidden border">
                         <Image src={recipe.imageUrl || "https://placehold.co/800x600.png"} alt={recipe.name} fill objectFit="cover" data-ai-hint="food image" />
                    </div>
                    <Button variant="outline" className="w-full mt-4">Changer la photo</Button>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

function RecipeDetailSkeleton() {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </header>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* General Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
  
            {/* Ingredients Card Skeleton */}
            <Card>
              <CardHeader>
                 <Skeleton className="h-6 w-32" />
                 <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
  
          {/* Right Column Skeleton */}
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
             <Card>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
             <Card>
              <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

    