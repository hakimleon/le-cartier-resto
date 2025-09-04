
import RecipeDetailClient from './RecipeDetailClient';

// Add searchParams to the page props
export default async function RecipeDetailPage({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
  // Pass the searchParams to the client component
  const fromWorkshop = searchParams?.from_workshop === 'true';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <RecipeDetailClient recipeId={params.id} fromWorkshop={fromWorkshop} />
      </div>
    </div>
  );
}
