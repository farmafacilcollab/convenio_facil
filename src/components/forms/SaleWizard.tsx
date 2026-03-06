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
    console.log("[SALE] === Início do envio ===");
    console.log("[SALE] storeId:", storeId);
    console.log("[SALE] user.id:", user.id);
    console.log("[SALE] convenio:", selectedConvenio.id, selectedConvenio.company_name);
    console.log("[SALE] conveniado:", selectedConveniado.id, selectedConveniado.full_name);
    console.log("[SALE] imagens:", imageCapture.images.length, imageCapture.images.map((img) => img ? `${Math.round(img.compressedSize / 1024)}KB` : "null"));

    const doSubmit = async (): Promise<string> => {
      const supabase = createClient();

      // 1. Get store slug for storage path
      console.log("[SALE] 1) Buscando slug da loja...");
      const t1 = Date.now();
      const { data: store, error: storeErr } = await supabase
        .from("stores")
        .select("slug")
        .eq("id", storeId)
        .single();
      console.log("[SALE] 1) Resultado:", { store, storeErr, ms: Date.now() - t1 });

      if (storeErr || !store) throw new Error("Loja não encontrada");

      // 2. Create sale record first to get ID
      console.log("[SALE] 2) Criando registro de venda...");
      const t2 = Date.now();
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
      console.log("[SALE] 2) Resultado:", { sale, saleError, ms: Date.now() - t2 });

      if (saleError || !sale) {
        throw saleError ?? new Error("Erro ao criar venda");
      }

      // 3. Upload images
      for (let i = 0; i < imageCapture.images.length; i++) {
        const img = imageCapture.images[i];
        if (!img) { console.log(`[SALE] 3) Imagem ${i}: null, pulando`); continue; }
        const suffix =
          img.installment_number !== null
            ? `req_${img.installment_number}`
            : "req_single";
        const path = `${store.slug}/${sale.id}/${suffix}.webp`;

        console.log(`[SALE] 3a) Upload imagem ${i}: path=${path}, size=${img.file.size}bytes, type=${img.file.type}`);
        const t3a = Date.now();
        const { error: uploadError } = await supabase.storage
          .from("requisitions")
          .upload(path, img.file, {
            contentType: "image/webp",
            upsert: false,
          });
        console.log(`[SALE] 3a) Upload resultado:`, { uploadError, ms: Date.now() - t3a });

        if (uploadError) throw uploadError;

        // Insert sale_images record
        console.log(`[SALE] 3b) Insert sale_images ${i}...`);
        const t3b = Date.now();
        const { error: imgError } = await supabase.from("sale_images").insert({
          sale_id: sale.id,
          installment_number: img.installment_number,
          storage_path: path,
          file_size_kb: Math.round(img.compressedSize / 1024),
        });
        console.log(`[SALE] 3b) Insert resultado:`, { imgError, ms: Date.now() - t3b });

        if (imgError) throw imgError;
      }

      console.log("[SALE] === Tudo OK, sale.id:", sale.id, "===");
      return sale.id;
    };

    try {
      const saleId = await Promise.race([
        doSubmit(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 60_000)
        ),
      ]);

      console.log("[SALE] Sucesso! Redirecionando para:", `/store/sales/${saleId}`);
      imageCapture.cleanup();
      toast.success(ptBR.saleSuccess);
      router.push(`/store/sales/${saleId}`);
    } catch (err: unknown) {
      console.error("[SALE] ERRO FINAL:", err);
      const message =
        err instanceof Error && err.message === "TIMEOUT"
          ? "Tempo limite excedido. Verifique sua conexão e tente novamente."
          : ptBR.saleError;
      toast.error(message);
    } finally {
      setSubmitting(false);
      console.log("[SALE] === Fim do envio ===");
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
