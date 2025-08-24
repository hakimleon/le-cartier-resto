

"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recipe, categories } from "@/data/definitions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlusCircle, Edit, Trash2, Clock, Star, FileText, Search, Package, Loader, Database, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DishForm } from "./DishForm";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { seedRecipes, saveDish, deleteDish, generateDishImagesAction } from "./actions";
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
    case 'Populaire': return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    case 'Halal': return "bg-blue-400/10 text-blue-300 border-blue-400/20";
    default: return "bg-secondary/10 text-secondary-foreground border-secondary/20";
  }
}

const MenuCategory = ({ title, items, onEdit, onDelete }: { title?: string, items: Recipe[], onEdit: (dish: Recipe) => void, onDelete: (dishId: string) => void }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card/50 rounded-xl border border-dashed">
          <p className="text-lg font-semibold">Aucun plat dans cette catégorie</p>
          <p className="text-sm">Essayez d'affiner votre recherche ou d'ajouter un nouveau plat.</p>
      </div>
    )
  }

  return (
    <div>
        {title && <h2 className="text-2xl font-bold font-headline mb-4 text-foreground">{title}</h2>}
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
    </div>
  )
};

const ImageSelectionModal = ({
  images,
  isOpen,
  onClose,
  onSelect,
}: {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choisissez votre image préférée</DialogTitle>
          <DialogDescription>
            Sélectionnez l'image générée par l'IA que vous souhaitez utiliser pour ce plat.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {images.map((imgSrc, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-lg overflow-hidden cursor-pointer border-4",
                selectedImage === imgSrc ? "border-primary" : "border-transparent"
              )}
              onClick={() => setSelectedImage(imgSrc)}
            >
              <Image src={imgSrc} alt={`Generated image ${index + 1}`} width={400} height={400} className="object-cover aspect-square" />
              {selectedImage === imgSrc && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSelect} disabled={!selectedImage}>
            Confirmer la sélection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };
  
  const getRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const recipesCol = collection(db, "recipes");
      const q = query(recipesCol, orderBy("name"));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setRecipes([]);
      } else {
        const recipeList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Recipe));
        setRecipes(recipeList);
      }
    } catch(error) {
      console.error("Error fetching recipes:", error);
      setRecipes([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getRecipes();
  }, [getRecipes, refreshKey]);


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
            onRefresh(); // Refresh the list
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
            onRefresh();
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
        onRefresh();
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

  const handleGenerateImages = async (formData: FormData) => {
    setIsGenerating(true);
    try {
      const result = await generateDishImagesAction(formData);
      if (result.success && result.data) {
        if (result.data.length === 1) {
            // If only one image, save directly without modal
            formData.set('image', result.data[0]);
            await handleSaveDish(formData);
        } else {
            setGeneratedImages(result.data);
            setIsImageModalOpen(true);
        }
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

  const handleImageSelected = async (imageUrl: string) => {
    // This assumes the form data is still available or can be retrieved
    // A more robust solution might store the form data in state before opening the modal.
    // For now, we find the form in the DOM - this is not ideal but works for this structure.
    const form = document.querySelector('form');
    if (form) {
      const formData = new FormData(form);
      formData.set('image', imageUrl);
      
      // We need to re-append other necessary fields that are not standard inputs
      formData.append('id', dishToEdit?.id || '');
      const statusSwitch = document.getElementById('status') as HTMLButtonElement | null;
      formData.set('status', statusSwitch?.dataset.state === 'checked' ? 'Actif' : 'Inactif');
      // ... other fields as needed ...

      await handleSaveDish(formData);
    }
    setIsImageModalOpen(false);
    setGeneratedImages([]);
  };

  const filteredRecipes = recipes.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isSearching = searchTerm.length > 0;

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
        ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card/50 rounded-xl border border-dashed">
                <Package className="w-16 h-16 text-muted-foreground/50" />
                <p className="text-lg font-semibold mt-4">Votre menu est vide.</p>
                <p className="text-sm">Cliquez sur le bouton ci-dessous pour initialiser votre menu avec des plats de démonstration.</p>
                <Button onClick={handleSeedDatabase} disabled={isSeeding} className="mt-4">
                    <Database className="mr-2 h-4 w-4" />
                    {isSeeding ? "Initialisation en cours..." : "Initialiser le menu"}
                </Button>
            </div>
        ) : isSearching ? (
            <MenuCategory 
                title={`Résultats de la recherche pour "${searchTerm}"`}
                items={filteredRecipes} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
        ) : (
            <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-6 h-auto gap-2 bg-transparent p-0">
                {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="whitespace-normal h-auto bg-card text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
                    {category}
                </TabsTrigger>
                ))}
            </TabsList>
            {categories.map((category) => (
                <TabsContent key={category} value={category}>
                <MenuCategory 
                    items={recipes.filter(item => item.category === category)} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                </TabsContent>
            ))}
            </Tabs>
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
            onGenerate={handleGenerateImages}
            isGenerating={isGenerating}
          />
        </DialogContent>
      </Dialog>
      
      <ImageSelectionModal 
        images={generatedImages}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSelect={handleImageSelected}
      />

    </div>
  );
}
