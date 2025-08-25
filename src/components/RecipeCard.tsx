
"use client";

import Image from "next/image";
import { Recipe } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, Pencil, Soup, Trash2 } from "lucide-react";
import { DishModal } from "@/app/(app)/menu/DishModal";

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
    const tags = recipe.tags || ['Épicé'];


    return (
        <Card className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
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
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold tracking-tight">{recipe.name}</h3>
                    <Badge variant={status === 'Actif' ? 'default' : 'secondary'} className={status === 'Actif' ? 'bg-green-600' : ''}>{status}</Badge>
                </div>

                <p className="text-sm text-foreground line-clamp-2">{recipe.description}</p>
                
                <div className="flex items-center gap-2 pt-1">
                  {tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>

            </CardContent>
            <CardFooter className="p-4 bg-muted/50 flex flex-col items-start gap-4">
               <div className="flex justify-between w-full text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Soup className="h-4 w-4" />
                        <span>{difficulty}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center w-full">
                    <div className="text-xl font-bold text-foreground">{recipe.price.toFixed(2)} €</div>
                    <div className="flex gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => console.log('Duplicate action')}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <DishModal dish={recipe} onSuccess={onSuccess}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </DishModal>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-500" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
