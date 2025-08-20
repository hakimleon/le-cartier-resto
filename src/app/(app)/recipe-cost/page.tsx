import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { RecipeCostForm } from "./RecipeCostForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function RecipeCostPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Fiche Technique de Recette">
        <Button asChild variant="outline">
           <Link href="/menu">
            <ChevronLeft className="mr-2" />
            Retour au menu
          </Link>
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <RecipeCostForm />
      </main>
    </div>
  );
}
