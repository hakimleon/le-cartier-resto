
import MenuAnalysisClient from './MenuAnalysisClient';

// Page en cours de reconstruction
export default function MenuAnalysisPage() {
    // La logique d'analyse sera reconstruite ici.
    const analyzedDishes = [];
    const error = "Cette page est en cours de reconstruction à votre demande. Nous allons la refaire correctement.";
    
    return <MenuAnalysisClient analyzedDishes={[]} initialError={error} />;
}
