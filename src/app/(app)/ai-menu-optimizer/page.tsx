import { AppHeader } from "@/components/common/AppHeader";
import { OptimizeMenuForm } from "./OptimizeMenuForm";

export default function AiMenuOptimizerPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Optimiseur de Menu IA" />
      <main className="flex-1 p-4 lg:p-6">
        <OptimizeMenuForm />
      </main>
    </div>
  );
}
