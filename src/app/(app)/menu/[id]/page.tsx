
import RecipeDetailClient from './RecipeDetailClient';

// Remove searchParams as they are no longer needed for this flow
export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  
  return (
    <div className="container mx-auto py-10">
        <RecipeDetailClient recipeId={params.id} />
    </div>
  );
}
