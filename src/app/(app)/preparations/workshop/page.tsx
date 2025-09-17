
// Pour l'instant, nous allons importer et utiliser le WorkshopClient existant.
// Nous le dupliquerons et l'adapterons à l'étape suivante.
import WorkshopClient from "../../workshop/WorkshopClient";

export default function PreparationWorkshopPage() {
  return (
      <WorkshopClient />
  );
}
