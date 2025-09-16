
import RecipeDetailClient from './RecipeDetailClient';

// Remove searchParams as they are no longer needed for this flow
export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  
  return (
    <div className="flex-1 overflow-y-auto">
        <RecipeDetailClient recipeId={params.id} />
    </div>
  );
}

    