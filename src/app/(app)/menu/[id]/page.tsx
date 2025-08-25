
import RecipeDetailClient from './RecipeDetailClient';

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10 px-8">
      <RecipeDetailClient recipeId={params.id} />
    </div>
  );
}

    