

"use client";

import { useParams } from 'next/navigation';
import RecipeDetailClient from './RecipeDetailClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function PreparationDetailPage() {
  const params = useParams();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!recipeId) {
    return (
       <div className="space-y-8">
        <header className="flex items-center justify-between"><div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-lg" /><div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-32" /></div></div><Skeleton className="h-10 w-24" /></header>
        <div className="text-center py-10">Chargement...</div>
      </div>
    )
  }

  return (
      <RecipeDetailClient recipeId={recipeId} />
  );
}
