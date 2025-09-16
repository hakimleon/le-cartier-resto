
import RecipeDetailClient from './RecipeDetailClient';

export default async function PreparationDetailPage({ params }: { params: { id:string } }) {
  return (
    <div className="container mx-auto py-10">
      <RecipeDetailClient recipeId={params.id} />
    </div>
  );
}
