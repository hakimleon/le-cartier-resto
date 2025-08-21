
"use client";

import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { RecipeCostForm } from "../RecipeCostForm";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { menuItems, MenuItem } from "@/data/mock-data";
import { notFound } from "next/navigation";

export default function DynamicRecipeCostPage({ params }: { params: { dishId: string } }) {
  const { dishId } = params;
  const dish = menuItems.find(item => item.id === dishId);

  if (!dish) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Fiche Technique de Recette">
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Mettre à jour la recette
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm dish={dish} />
      </main>
    </div>
  );
}
