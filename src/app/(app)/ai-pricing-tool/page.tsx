import { AppHeader } from "@/components/common/AppHeader";
import { DynamicPricingForm } from "./DynamicPricingForm";

export default function AiPricingToolPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Prix Dynamique IA" />
      <main className="flex-1 p-4 lg:p-6">
        <DynamicPricingForm />
      </main>
    </div>
  );
}
