
import RecipeDetailClient from './RecipeDetailClient';

export default async function PreparationDetailPage({ params }: { params: { id:string } }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <RecipeDetailClient recipeId={params.id} />
      </div>
    </div>
  );
}
