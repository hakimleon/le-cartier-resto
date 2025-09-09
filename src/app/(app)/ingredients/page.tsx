
import { Package } from "lucide-react";
import IngredientsClient from "./IngredientsClient";

export default function IngredientsPage() {
  return (
    <>
       <header className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-muted-foreground">Inventaire</h2>
      </header>
      <IngredientsClient />
    </>
  );
}
