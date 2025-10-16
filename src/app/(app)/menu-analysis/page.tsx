
import MenuAnalysisClient from './MenuAnalysisClient';

// This page is now a simple wrapper. All data fetching and processing is moved to the client
// to prevent server-side crashes with complex data aggregation.
export default function MenuAnalysisPage() {
    return <MenuAnalysisClient />;
}
