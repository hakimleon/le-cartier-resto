
"use client";

import { AppHeader } from "@/components/common/AppHeader";
import { RecipeCostForm } from "../RecipeCostForm";
import { menuItems } from "@/data/mock-data";
import { notFound } from "next/navigation";

export default function DynamicRecipeCostPage({ params }: { params: { dishId: string } }) {
  const { dishId } = params;
  const dish = menuItems.find(item => item.id === dishId);

  if (!dish) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title={`Fiche Technique: ${dish.name}`} />
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm dish={dish} />
      </main>
    </div>
  );
}
