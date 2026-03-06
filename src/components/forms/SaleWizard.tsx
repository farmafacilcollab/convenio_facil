"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConvenios } from "@/hooks/useConvenios";
import { useConveniados } from "@/hooks/useConveniados";
import { useImageCapture } from "@/hooks/useImageCapture";
import { UnsavedChangesGuard } from "@/components/layout/UnsavedChangesGuard";
import { StepConvenio } from "./steps/StepConvenio";
import { StepConveniado } from "./steps/StepConveniado";
import { StepDetails } from "./steps/StepDetails";
import { StepPhotos } from "./steps/StepPhotos";
import { StepReview } from "./steps/StepReview";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const router = useRouter();
  const { storeId, user } = useAuth();
  const { convenios, isLoading: loadingConvenios } = useConvenios();
  const { conveniados, isLoading: loadingConveniados, fetchConveniados } =
    useConveniados();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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

  const isDirty = currentStep > 0;

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
    const supabase = createClient();

    try {
      // 1. Get store slug for storage path
      const { data: store } = await supabase
        .from("stores")
        .select("slug")
        .eq("id", storeId)
        .single();

      if (!store) throw new Error("Loja não encontrada");

      // 2. Create sale record first to get ID
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          store_id: storeId,
          convenio_id: selectedConvenio.id,
          conveniado_id: selectedConveniado.id,
          sale_date: saleDate,
          total_value: totalValue,
          is_installment: isInstallment,
          installment_count: installmentCount,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      // 3. Upload images
      const uploadedPaths: string[] = [];
      try {
        for (const img of imageCapture.images) {
          if (!img) continue;
          const suffix =
            img.installment_number !== null
              ? `req_${img.installment_number}`
              : "req_single";
          const path = `${store.slug}/${sale.id}/${suffix}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("requisitions")
            .upload(path, img.file, {
              contentType: "image/webp",
              upsert: false,
            });

          if (uploadError) throw uploadError;
          uploadedPaths.push(path);

          // Insert sale_images record
          await supabase.from("sale_images").insert({
            sale_id: sale.id,
            installment_number: img.installment_number,
            storage_path: path,
            file_size_kb: Math.round(img.compressedSize / 1024),
          });
        }
      } catch (uploadErr) {
        // Rollback: delete sale and uploaded images
        await supabase.from("sales").delete().eq("id", sale.id);
        for (const path of uploadedPaths) {
          await supabase.storage.from("requisitions").remove([path]);
        }
        throw uploadErr;
      }

      imageCapture.cleanup();
      toast.success(ptBR.saleSuccess);
      router.push(`/store/sales/${sale.id}`);
    } catch (err) {
      console.error("Sale submission error:", err);
      toast.error(ptBR.saleError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <UnsavedChangesGuard isDirty={isDirty} />

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {ptBR.step} {currentStep + 1} de {STEPS.length}
          </span>
          <span>{STEPS[currentStep]}</span>
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
            className="flex-1"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={submitting}
          >
            {ptBR.previous}
          </Button>
        )}

        {currentStep < STEPS.length - 1 ? (
          <Button
            size="lg"
            className="flex-1"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            {ptBR.next}
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
          >
            {submitting ? ptBR.loading : ptBR.confirmSale}
          </Button>
        )}
      </div>
    </div>
  );
}
