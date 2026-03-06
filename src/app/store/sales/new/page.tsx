import { SaleWizard } from "@/components/forms/SaleWizard";
import { ptBR } from "@/lib/i18n/pt-BR";

export default function NewSalePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{ptBR.newSale}</h2>
      <SaleWizard />
    </div>
  );
}
