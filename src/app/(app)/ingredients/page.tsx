
import { Package } from "lucide-react";
import IngredientsClient from "./IngredientsClient";

export default function IngredientsPage() {
  return (
    <div className="container mx-auto py-10 px-8">
       <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
             <div className="bg-muted rounded-full h-12 w-12 flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inventaire des Ingrédients</h1>
                <p className="text-muted-foreground">Gérez vos ingrédients et leurs prix d'achat.</p>
            </div>
        </div>
      </header>
      <IngredientsClient />
    </div>
  );
}
