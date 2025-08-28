
import RecipeDetailClient from './RecipeDetailClient';

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <RecipeDetailClient recipeId={params.id} />
    </div>
  );
}

    
