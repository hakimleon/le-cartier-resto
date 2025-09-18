
import GarnishDetailClient from './GarnishDetailClient';

export default function GarnishDetailPage({ params }: { params: { id: string } }) {

  return (
      <GarnishDetailClient recipeId={params.id} />
  );
}
