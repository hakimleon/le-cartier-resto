
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { RecipeCostForm } from "./RecipeCostForm";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function RecipeCostPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Nouvelle Fiche Technique">
         <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer la recette
          </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm dish={null} />
      </main>
    </div>
  );
}
