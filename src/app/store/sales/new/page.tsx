import { SaleWizard } from "@/components/forms/SaleWizard";
import { ptBR } from "@/lib/i18n/pt-BR";

export default function NewSalePage() {
  return (
    <div className="animate-ios-fade-in space-y-4">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.newSale}</h2>
      <SaleWizard />
    </div>
  );
}
