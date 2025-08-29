
"use client";

import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Pencil, Soup, Tag, Trash2 } from "lucide-react";
import { DishModal } from "@/app/(app)/menu/DishModal";
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

type RecipeCardProps = {
    recipe: Recipe;
    onDelete: () => void;
    onSuccess: () => void;
};

export function RecipeCard({ recipe, onDelete, onSuccess }: RecipeCardProps) {
    const placeholderImage = "https://placehold.co/600x400.png";
    const status = recipe.status || 'Actif';
    const duration = recipe.duration || 25;
    const difficulty = recipe.difficulty || 'Moyen';
    // Les tags seront gérés dynamiquement plus tard
    const tags = recipe.tags || ['Épicé']; 

    return (
        <Card className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group">
            
                <CardHeader className="p-0">
                    <div className="relative w-full h-40">
                        <Image
                            src={recipe.imageUrl || placeholderImage}
                            alt={recipe.name}
                            fill
                            className="object-cover"
                            data-ai-hint="food image"
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-tight">{recipe.name}</h3>
                        <Badge variant={status === 'Actif' ? 'default' : 'secondary'} className={cn(
                            status === 'Actif' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                        )}>{status}</Badge>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary">{recipe.category}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{recipe.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {tags.map(tag => (
                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                                <Tag className="h-3 w-3"/>
                                <span>{tag}</span>
                            </Badge>
                        ))}
                    </div>
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
                <div className="text-xl font-bold text-foreground">{recipe.price.toFixed(2)} €</div>
                <div className="flex gap-1">
                     <Link href={`/menu/${recipe.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FileText className="h-4 w-4" />
                        </Button>
                    </Link>
                    <DishModal dish={recipe} onSuccess={onSuccess}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DishModal>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le plat "{recipe.name}" sera supprimé définitivement.
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
