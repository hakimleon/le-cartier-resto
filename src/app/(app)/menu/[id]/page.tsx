
export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10 px-8">
      <h1 className="text-3xl font-bold">Fiche Technique du Plat</h1>
      <p className="text-muted-foreground mt-2">
        Ceci est la page de détail pour la recette avec l'ID : <strong>{params.id}</strong>.
      </p>
      <div className="mt-8 border-2 border-dashed rounded-lg p-16 text-center">
        <p className="text-muted-foreground">Le contenu détaillé de la fiche technique sera construit ici.</p>
      </div>
    </div>
  );
}
