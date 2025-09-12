
import AssistantClient from './AssistantClient';

export default function AssistantPage() {
  return (
    // Ce conteneur permet au composant enfant de gérer sa propre hauteur et largeur.
    <div className="h-full w-full">
      <AssistantClient />
    </div>
  );
}
