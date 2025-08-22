

"use client";

import { AppHeader } from "@/components/common/AppHeader";
import { RecipeCostForm } from "../RecipeCostForm";
import { recipes } from "@/data/mock-data";
import { notFound } from "next/navigation";

export default function DynamicRecipeCostPage({ params }: { params: { dishId: string } }) {
  const { dishId } = params;
  const recipe = recipes.find(item => item.id === dishId);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title={`Fiche Technique: ${recipe.name}`} />
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm recipe={recipe} />
      </main>
    </div>
  );
}

    