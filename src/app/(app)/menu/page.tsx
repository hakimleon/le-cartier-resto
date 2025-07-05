"use client";

import Image from "next/image";
import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuItems as initialMenuItems, MenuItem, categories } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlusCircle, Edit, Trash2, Clock, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DishForm } from "./DishForm";
import { useToast } from "@/hooks/use-toast";

const getStatusClass = (status: MenuItem['status']) => {
  switch (status) {
    case 'Actif': return "border-green-500 bg-green-100 text-green-800";
    case 'Saisonnier': return "border-blue-500 bg-blue-100 text-blue-800";
    case 'Inactif': return "border-gray-500 bg-gray-100 text-gray-800";
  }
};

const MenuCategory = ({ items, onEdit, onDelete }: { items: MenuItem[], onEdit: (dish: MenuItem) => void, onDelete: (dishId: string) => void }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((item) => (
      <Card key={item.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative w-full h-48">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            data-ai-hint={item.imageHint}
          />
           <Badge className={cn("absolute top-2 right-2", getStatusClass(item.status))}>{item.status}</Badge>
        </div>
        <CardHeader>
          <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground gap-4 pt-1">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.prepTime} min</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3"/> Diff. {item.difficulty}/5</span>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <CardDescription>{item.description}</CardDescription>
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <p className="text-lg font-semibold text-primary">{item.price.toFixed(2)} €</p>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
          </div>
        </CardFooter>
      </Card>
    ))}
  </div>
);

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const handleAddNew = () => {
    setDishToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (dish: MenuItem) => {
    setDishToEdit(dish);
    setIsDialogOpen(true);
  };
  
  const handleSaveDish = (dishData: MenuItem) => {
    if (dishToEdit) {
      setMenuItems(menuItems.map(item => item.id === dishData.id ? dishData : item));
      toast({ title: "Plat mis à jour !", description: `Le plat "${dishData.name}" a été modifié.` });
    } else {
      setMenuItems([...menuItems, { ...dishData, id: `menu-${Date.now()}` }]);
      toast({ title: "Plat ajouté !", description: `Le plat "${dishData.name}" a été ajouté au menu.` });
    }
    setIsDialogOpen(false);
    setDishToEdit(null);
  };

  const handleDelete = (dishId: string) => {
    const dishName = menuItems.find(d => d.id === dishId)?.name;
    setMenuItems(menuItems.filter(item => item.id !== dishId));
    toast({ variant: "destructive", title: "Plat supprimé !", description: `Le plat "${dishName}" a été supprimé.` });
  };
  
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Gestion du Menu">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Ajouter un plat
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <MenuCategory 
                items={menuItems.filter(item => item.category === category)} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0">
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
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
