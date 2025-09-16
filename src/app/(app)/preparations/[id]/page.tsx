
import RecipeDetailClient from './RecipeDetailClient';

export default async function PreparationDetailPage({ params }: { params: { id:string } }) {
  return (
      <RecipeDetailClient recipeId={params.id} />
  );
}

