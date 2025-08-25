
"use client";

import Image from "next/image";
import { Recipe } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DishModal } from "@/app/(app)/menu/DishModal";

type RecipeCardProps = {
    recipe: Recipe;
    onEdit: () => void;
    onDelete: () => void;
    onSuccess: () => void;
};

export function RecipeCard({ recipe, onDelete, onSuccess }: RecipeCardProps) {
    const placeholderImage = "https://placehold.co/600x400.png";

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                <div className="relative w-full h-48">
                    <Image
                        src={recipe.imageUrl || placeholderImage}
                        alt={recipe.name}
                        fill
                        className="object-cover rounded-t-lg"
                        data-ai-hint="food image"
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-4 space-y-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DishModal dish={recipe} onSuccess={onSuccess}>
                                <button className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Modifier
                                </button>
                            </DishModal>
                            <DropdownMenuItem onClick={onDelete} className="text-red-500 hover:text-red-500 hover:!bg-red-50 focus:text-red-500 focus:!bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardDescription className="text-sm line-clamp-2">{recipe.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center">
                 <Badge variant="outline">{recipe.category}</Badge>
                <div className="font-semibold text-lg">{recipe.price.toFixed(2)} €</div>
            </CardFooter>
        </Card>
    );
}
