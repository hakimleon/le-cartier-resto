
import AssistantClient from './AssistantClient';

export default function AssistantPage() {
  // Ce conteneur annule le padding horizontal du layout principal (-mx-4 md:-mx-8)
  // pour permettre au chatbot de prendre toute la largeur.
  return (
    <div className="-mx-4 -my-6 md:-mx-8 md:-my-6">
      <AssistantClient />
    </div>
  );
}
