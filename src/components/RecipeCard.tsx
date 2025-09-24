
"use client";

import Image from "next/image";
import Link from "next/link";
import { Recipe, Preparation } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Pencil, Soup, Tag, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DishModal } from "@/app/(app)/menu/DishModal";
import { PreparationModal } from "@/app/(app)/preparations/PreparationModal";
import { updateDishStatus } from "@/app/(app)/menu/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";

type RecipeCardProps = {
    recipe: Recipe | Preparation;
    onDelete: () => void;
    allCategories?: string[]; // Make it optional for preparations
};

export function RecipeCard({ recipe, onDelete, allCategories = [] }: RecipeCardProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const placeholderImage = "https://placehold.co/600x400.png";
    
    const isPreparation = recipe.type === 'Préparation';
    
    const status = !isPreparation ? (recipe as Recipe).status : undefined;
    const duration = recipe.duration || 25;
    const difficulty = recipe.difficulty || 'Moyen';
    const tags = recipe.tags || []; 
    const detailUrl = isPreparation ? `/preparations/${recipe.id}` : `/menu/${recipe.id}`;

    const handleStatusToggle = () => {
        if (isPreparation || !recipe.id) return;
        const newStatus = status === 'Actif' ? 'Inactif' : 'Actif';
        startTransition(async () => {
            try {
                await updateDishStatus(recipe.id!, newStatus);
                toast({
                    title: "Statut mis à jour",
                    description: `Le plat "${recipe.name}" est maintenant ${newStatus.toLowerCase()}.`,
                });
            } catch (error) {
                toast({
                    title: "Erreur",
                    description: "Impossible de mettre à jour le statut.",
                    variant: "destructive"
                });
            }
        });
    };

    const EditModal = () => {
        if (recipe.type === 'Plat') {
            return (
                <DishModal dish={recipe as Recipe} allCategories={allCategories} onSuccess={() => { /* onSnapshot handles updates */ }}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </DishModal>
            )
        }
        if (recipe.type === 'Préparation') {
            return (
                <PreparationModal preparation={recipe as Preparation} onSuccess={() => { /* onSnapshot handles updates */ }}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </PreparationModal>
            )
        }
        return null;
    }

    return (
        <Card className={cn(
            "flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group",
            status === 'Inactif' && "grayscale opacity-75"
        )}>
            
            <CardHeader className="p-0">
                <div className="relative w-full h-40">
                     <Link href={detailUrl}>
                        <Image
                            src={recipe.imageUrl || placeholderImage}
                            alt={recipe.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            data-ai-hint={isPreparation ? "sauce food" : "food image"}
                        />
                    </Link>
                    {status && (
                         <Badge variant={status === 'Actif' ? 'default' : 'secondary'} className={cn(
                            "absolute bottom-2 right-2",
                            status === 'Actif' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                        )}>{status}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-4 space-y-3">
                <div>
                     <Link href={detailUrl} className="hover:underline">
                        <h3 className="text-lg font-bold tracking-tight">{recipe.name}</h3>
                     </Link>
                     {isPreparation && (
                        <Badge variant="outline" className="mt-1">Préparation</Badge>
                     )}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{recipe.description}</p>
                </div>
                {tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {tags.map(tag => (
                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                                <Tag className="h-3 w-3"/>
                                <span>{tag}</span>
                            </Badge>
                        ))}
                    </div>
                )}
                 <div className="flex justify-between w-full text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Soup className="h-4 w-4" />
                        <span>{difficulty}</span>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
                <div className="text-xl font-bold text-foreground">
                    {!isPreparation && recipe.price ? `${Math.round(recipe.price)} DZD` : ' '}
                </div>
                <div className="flex gap-1">
                     <Link href={detailUrl}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir la fiche technique">
                            <FileText className="h-4 w-4" />
                        </Button>
                    </Link>
                    
                    {!isPreparation && (
                         <Button variant="ghost" size="icon" className="h-8 w-8" title={status === 'Actif' ? 'Rendre inactif' : 'Rendre actif'} onClick={handleStatusToggle} disabled={isPending}>
                            {status === 'Actif' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    )}

                    <EditModal />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. L'élément "{recipe.name}" sera supprimé définitivement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardFooter>
        </Card>
    );
}
