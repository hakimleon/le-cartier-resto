import { AppHeader } from "@/components/common/AppHeader";
import { MenuGeneratorForm } from "./MenuGeneratorForm";

export default function DailyMenuGeneratorPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Générateur de Menu IA" />
      <main className="flex-1 p-4 lg:p-6">
        <MenuGeneratorForm />
      </main>
    </div>
  );
}
