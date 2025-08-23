

import Image from "next/image";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recipe, categories } from "@/data/definitions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlusCircle, Edit, Trash2, Clock, Star, FileText, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DishForm } from "./DishForm";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MenuClient } from "./MenuClient";


async function getRecipes(): Promise<Recipe[]> {
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    const recipeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Recipe));
    return recipeList;
}


export default async function MenuPage() {
  const recipes = await getRecipes();

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <MenuClient initialRecipes={recipes} />
    </div>
  );
}
