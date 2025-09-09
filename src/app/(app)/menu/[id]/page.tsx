
import RecipeDetailClient from './RecipeDetailClient';

// Remove searchParams as they are no longer needed for this flow
export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  
  return (
      <RecipeDetailClient recipeId={params.id} />
  );
}
