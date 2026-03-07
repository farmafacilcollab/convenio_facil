"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useConvenios } from "@/hooks/useConvenios";
import { useConveniados } from "@/hooks/useConveniados";
import { useImageCapture } from "@/hooks/useImageCapture";
import { submitSale } from "@/app/store/sales/new/actions";
import { UnsavedChangesGuard } from "@/components/layout/UnsavedChangesGuard";
import { StepConvenio } from "./steps/StepConvenio";
import { StepConveniado } from "./steps/StepConveniado";
import { StepDetails } from "./steps/StepDetails";
import { StepPhotos } from "./steps/StepPhotos";
import { StepReview } from "./steps/StepReview";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ptBR } from "@/lib/i18n/pt-BR";
import type { Convenio, Conveniado } from "@/lib/types/app.types";

const STEPS = [
  ptBR.selectConvenio,
  ptBR.selectConveniado,
  ptBR.saleDetails,
  ptBR.photoCapture,
  ptBR.reviewSubmit,
];

export function SaleWizard() {
  const { storeId, user } = useAuth();
  const { convenios, isLoading: loadingConvenios } = useConvenios();
  const { conveniados, isLoading: loadingConveniados, fetchConveniados } =
    useConveniados();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successSaleId, setSuccessSaleId] = useState<string | null>(null);

  // Form state
  const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null);
  const [selectedConveniado, setSelectedConveniado] = useState<Conveniado | null>(null);
  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [totalValue, setTotalValue] = useState<number>(0);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number | null>(null);

  const imageCount = isInstallment && installmentCount ? installmentCount : 1;
  const imageCapture = useImageCapture(imageCount);

  const isDirty = currentStep > 0 && !successSaleId;

  const handleConvenioSelect = useCallback(
    (convenio: Convenio) => {
      setSelectedConvenio(convenio);
      setSelectedConveniado(null);
      fetchConveniados(convenio.id);
    },
    [fetchConveniados]
  );

  const handleInstallmentChange = useCallback(
    (value: boolean) => {
      setIsInstallment(value);
      if (!value) {
        setInstallmentCount(null);
        imageCapture.reset(1);
      }
    },
    [imageCapture]
  );

  const handleInstallmentCountChange = useCallback(
    (count: number) => {
      setInstallmentCount(count);
      imageCapture.reset(count);
    },
    [imageCapture]
  );

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!selectedConvenio;
      case 1:
        return !!selectedConveniado;
      case 2:
        return totalValue > 0 && !!saleDate && (!isInstallment || !!installmentCount);
      case 3:
        return imageCapture.allCaptured;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!storeId || !user || !selectedConvenio || !selectedConveniado) return;

    setSubmitting(true);

    try {
      const fd = new FormData();

      fd.set("data", JSON.stringify({
        store_id: storeId,
        convenio_id: selectedConvenio.id,
        conveniado_id: selectedConveniado.id,
        sale_date: saleDate,
        total_value: totalValue,
        is_installment: isInstallment,
        installment_count: installmentCount,
        created_by: user.id,
      }));

      imageCapture.images.forEach((img, i) => {
        if (!img) return;
        fd.set(`file_${i}`, img.file);
        if (img.installment_number !== null) {
          fd.set(`installment_${i}`, String(img.installment_number));
        }
      });

      const result = await submitSale(fd);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      imageCapture.cleanup();
      setSuccessSaleId(result.saleId!);
      toast.success(ptBR.saleSuccess);
    } catch (err: unknown) {
      console.error("Sale submission error:", err);
      toast.error(ptBR.saleError);
    } finally {
      setSubmitting(false);
    }
  };

  if (successSaleId) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h3 className="text-lg font-semibold">Venda registrada com sucesso!</h3>
            <p className="text-center text-sm text-muted-foreground">
              A venda foi salva e a imagem da requisição foi enviada.
            </p>
            <div className="flex w-full flex-col gap-3 pt-2">
              <a href={`/store/sales/${successSaleId}`}>
                <Button size="lg" className="w-full rounded-xl">Ver Detalhes</Button>
              </a>
              <a href="/store/sales/new">
                <Button variant="outline" size="lg" className="w-full rounded-xl">Nova Venda</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <UnsavedChangesGuard isDirty={isDirty} />

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {ptBR.step} {currentStep + 1} de {STEPS.length}
          </span>
          <span className="font-medium">{STEPS[currentStep]}</span>
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} />
      </div>

      {/* Step content with transition */}
      <div className="transition-all duration-200 ease-in-out">
        {currentStep === 0 && (
          <StepConvenio
            convenios={convenios}
            isLoading={loadingConvenios}
            selected={selectedConvenio}
            onSelect={handleConvenioSelect}
          />
        )}
        {currentStep === 1 && (
          <StepConveniado
            conveniados={conveniados}
            isLoading={loadingConveniados}
            selected={selectedConveniado}
            onSelect={setSelectedConveniado}
          />
        )}
        {currentStep === 2 && (
          <StepDetails
            saleDate={saleDate}
            onDateChange={setSaleDate}
            totalValue={totalValue}
            onValueChange={setTotalValue}
            isInstallment={isInstallment}
            onInstallmentChange={handleInstallmentChange}
            installmentCount={installmentCount}
            onInstallmentCountChange={handleInstallmentCountChange}
          />
        )}
        {currentStep === 3 && (
          <StepPhotos
            imageCount={imageCount}
            isInstallment={isInstallment}
            imageCapture={imageCapture}
          />
        )}
        {currentStep === 4 && (
          <StepReview
            convenio={selectedConvenio}
            conveniado={selectedConveniado}
            saleDate={saleDate}
            totalValue={totalValue}
            isInstallment={isInstallment}
            installmentCount={installmentCount}
            images={imageCapture.images}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-xl"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={submitting}
          >
            {ptBR.previous}
          </Button>
        )}

        {currentStep < STEPS.length - 1 ? (
          <Button
            size="lg"
            className="flex-1 rounded-xl"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            {ptBR.next}
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1 rounded-xl"
          >
            {submitting ? ptBR.loading : ptBR.confirmSale}
          </Button>
        )}
      </div>
    </div>
  );
}
