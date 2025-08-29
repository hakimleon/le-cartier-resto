
import { Package } from "lucide-react";
import IngredientsClient from "./IngredientsClient";

export default function IngredientsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <header className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-muted-foreground">Inventaire</h2>
      </header>
      <IngredientsClient />
    </div>
  );
}
