

import { AppHeader } from "@/components/common/AppHeader";
import { RecipeCostForm } from "./RecipeCostForm";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function RecipeCostPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Nouvelle Fiche Technique" />
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm recipe={null} />
      </main>
    </div>
  );
}
