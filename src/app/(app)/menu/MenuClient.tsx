

"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Recipe, categories } from "@/data/definitions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlusCircle, Edit, Trash2, Clock, Star, FileText, Search, Package, Loader, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DishForm } from "./DishForm";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { seedRecipes, saveDish, deleteDish, generateDishImageAction } from "./actions";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";


const getStatusClass = (status: Recipe['status']) => {
  switch (status) {
    case 'Actif': return "bg-green-500/10 text-green-400 border-green-500/20";
    case 'Saisonnier': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case 'Inactif': return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

const getTagClass = (tag: Recipe['tags'][number]) => {
  switch (tag) {
    case 'Végétarien': return "bg-yellow-400/10 text-yellow-300 border-yellow-400/20";
    case 'Épicé': return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case 'Sans gluten': return "bg-purple-400/10 text-purple-300 border-purple-400/20";
    case 'Nouveau': return "bg-teal-400/10 text-teal-300 border-teal-400/20";
    case 'Populaire': return "bg-pink-500/10 text-pink-400 border-pink-400/20";
    case 'Halal': return "bg-blue-400/10 text-blue-300 border-blue-400/20";
    default: return "bg-secondary/10 text-secondary-foreground border-secondary/20";
  }
}

const MenuCategory = ({ title, items, onEdit, onDelete }: { title: string, items: Recipe[], onEdit: (dish: Recipe) => void, onDelete: (dishId: string) => void }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card/50 rounded-xl border border-dashed">
          <p className="text-lg font-semibold">Aucun plat dans cette catégorie</p>
          <p className="text-sm">Essayez d'affiner votre recherche ou d'ajouter un nouveau plat.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((item) => (
        <Card key={item.id} className="flex flex-col overflow-hidden bg-card shadow-lg hover:shadow-primary/20 transition-all duration-300 border-border/10 rounded-xl group hover:border-primary/30">
        <div className="relative w-full h-48">
            <Image
            src={item.image || 'https://placehold.co/600x400.png'}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={item.imageHint}
            />
            <Badge className={cn("absolute top-3 right-3 text-xs font-semibold", getStatusClass(item.status))}>{item.status}</Badge>
        </div>
        <CardHeader className="p-4">
            <CardTitle className="font-headline text-xl text-foreground">{item.name}</CardTitle>
            <div className="flex items-center text-xs text-muted-foreground gap-4 pt-1">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-accent"/> {item.prepTime} min</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent"/> Diff {item.difficulty}/5</span>
            </div>
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0 space-y-4">
            <CardDescription className="text-sm">{item.description}</CardDescription>
            <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => <Badge key={tag} className={cn("text-xs font-medium", getTagClass(tag))}>{tag}</Badge>)}
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 bg-card/50 mt-auto">
            <p className="text-lg font-bold text-primary font-code">{item.price.toFixed(2).replace('.', ',')} €</p>
            <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-green-500" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce plat ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le plat "{item.name}" sera définitivement supprimé.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-secondary">
                <Link href={`/recipe-cost/${item.id}`}>
                    <FileText className="h-4 w-4" />
                </Link>
                </Button>
            </div>
        </CardFooter>
        </Card>
    ))}
    </div>
  )
};

export default function MenuClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const recipesCol = collection(db, "recipes");
      let snapshot;
      try {
        // Try to fetch with ordering first
        const q = query(recipesCol, orderBy("name"));
        snapshot = await getDocs(q);
      } catch (error) {
        console.error("Firebase orderBy index error (expected on first run). Fetching without order.", error);
        // Fallback: fetch without ordering if ordering fails (e.g., index not created yet)
        snapshot = await getDocs(recipesCol);
      }
      
      const recipeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recipe));
      setRecipes(recipeList);

    } catch (e) {
      console.error("Error fetching recipes from Firestore:", e);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les recettes. Vérifiez la console pour les erreurs.",
      });
      setRecipes([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);


  const handleAddNew = () => {
    setDishToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (dish: Recipe) => {
    setDishToEdit(dish);
    setIsDialogOpen(true);
  };
  
  const handleSaveDish = async (formData: FormData) => {
    setIsSaving(true);
    const dishName = formData.get('name') as string;
    try {
        const result = await saveDish(formData);
        if (result.success) {
            toast({ title: "Succès !", description: `Le plat "${dishName}" a été sauvegardé.` });
            setIsDialogOpen(false);
            setDishToEdit(null);
            fetchRecipes(); // Refresh the list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erreur lors de la sauvegarde",
            description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (dishId: string) => {
    const dishName = recipes.find(d => d.id === dishId)?.name;
    try {
        const result = await deleteDish(dishId);
        if (result.success) {
            toast({ variant: "destructive", title: "Plat supprimé !", description: `Le plat "${dishName}" a été supprimé.` });
            fetchRecipes();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Erreur lors de la suppression",
            description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        });
    }
  };
  
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const result = await seedRecipes();
      if (result.success) {
        toast({
          title: "Menu initialisé !",
          description: result.message,
        });
        fetchRecipes();
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        });
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur inattendue est survenue.",
        });
    } finally {
        setIsSeeding(false);
    }
  };

  const handleGenerateImage = async (formData: FormData) => {
    setIsGenerating(true);
    try {
      const result = await generateDishImageAction(formData);
      if (result.success && result.data) {
        formData.set('image', result.data.imageUrl);
        await handleSaveDish(formData); // This will also close the dialog and refresh
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de génération d'image",
        description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const filteredRecipes = recipes.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderContent = () => {
    if (filteredRecipes.length === 0 && searchTerm.length > 0) {
      return (
        <div className="text-center py-10">
          <p>Aucun plat trouvé pour "{searchTerm}".</p>
        </div>
      )
    }

    return (
      <Tabs defaultValue={categories[0]} className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <TabsList className="overflow-x-auto overflow-y-hidden h-auto">
            {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="whitespace-nowrap">{category}</TabsTrigger>
            ))}
            </TabsList>
        </div>
        {categories.map((category) => {
          const items = filteredRecipes.filter(item => item.category === category);
          return (
            <TabsContent key={category} value={category}>
                <MenuCategory title="" items={items} onEdit={handleEdit} onDelete={handleDelete} />
            </TabsContent>
          )
        })}
      </Tabs>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <AppHeader title="Gestion du Menu">
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2" />
          Ajouter un plat
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <div className="mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher un plat par nom, tag, description..." 
                    className="pl-9 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center h-64 gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                <p>Chargement du menu...</p>
            </div>
        ) : recipes.length === 0 && !searchTerm ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card/50 rounded-xl border border-dashed">
                <Package className="w-16 h-16 text-muted-foreground/50" />
                <p className="text-lg font-semibold mt-4">Votre menu est vide.</p>
                <p className="text-sm">Cliquez sur le bouton ci-dessous pour initialiser votre menu avec des plats de démonstration.</p>
                <Button onClick={handleSeedDatabase} disabled={isSeeding} className="mt-4">
                    <Database className="mr-2 h-4 w-4" />
                    {isSeeding ? "Initialisation en cours..." : "Initialiser le menu"}
                </Button>
            </div>
        ) : (
            renderContent()
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setDishToEdit(null); setIsDialogOpen(open); }}>
        <DialogContent className="max-w-4xl p-0 bg-card border-border/20">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-headline text-2xl">{dishToEdit ? "Modifier le plat" : "Ajouter un nouveau plat"}</DialogTitle>
            <DialogDescription>
              Remplissez les informations ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <DishForm 
            dish={dishToEdit}
            onSave={handleSaveDish}
            onCancel={() => setIsDialogOpen(false)}
            isSaving={isSaving}
            onGenerate={handleGenerateImage}
            isGenerating={isGenerating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
