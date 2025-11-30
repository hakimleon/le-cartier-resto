"use client";

import { useParams } from "next/navigation";
import IngredientDetailClient from "./IngredientDetailClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function IngredientDetailPage() {
  const params = useParams();
  const ingredientId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!ingredientId) {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-start gap-4 flex-grow">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </header>
        <div className="text-center py-10">Chargement...</div>
      </div>
    );
  }

  return <IngredientDetailClient ingredientId={ingredientId} />;
}
