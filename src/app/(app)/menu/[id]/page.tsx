
import RecipeDetailClient from './RecipeDetailClient';

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <RecipeDetailClient recipeId={params.id} />
  );
}

    