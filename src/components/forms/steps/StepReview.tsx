"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatBRL } from "@/lib/utils/currency";
import { formatCNPJ } from "@/lib/utils/cnpj";
import { maskCPFDisplay } from "@/lib/utils/cpf";
import { format } from "date-fns";
import { ptBR as datePtBR } from "date-fns/locale";
import type { Convenio, Conveniado, CompressedImage } from "@/lib/types/app.types";

interface Props {
  convenio: Convenio | null;
  conveniado: Conveniado | null;
  saleDate: string;
  totalValue: number;
  isInstallment: boolean;
  installmentCount: number | null;
  images: (CompressedImage | null)[];
}

export function StepReview({
  convenio,
  conveniado,
  saleDate,
  totalValue,
  isInstallment,
  installmentCount,
  images,
}: Props) {
  return (
    <Card className="shadow-subtle">
      <CardContent className="space-y-4 py-4">
        <h3 className="text-base font-semibold">{ptBR.reviewSubmit}</h3>
        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{ptBR.convenio}</span>
            <span className="text-right font-medium">
              {convenio?.company_name}
              <br />
              <span className="text-xs text-muted-foreground">
                {convenio?.cnpj ? formatCNPJ(convenio.cnpj) : ""}
              </span>
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">{ptBR.conveniados}</span>
            <span className="text-right font-medium">
              {conveniado?.full_name}
              <br />
              <span className="text-xs text-muted-foreground">
                {conveniado ? maskCPFDisplay(conveniado.cpf) : ""}
              </span>
            </span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-muted-foreground">{ptBR.saleDate}</span>
            <span className="font-medium">
              {format(new Date(saleDate + "T12:00:00"), "dd/MM/yyyy", { locale: datePtBR })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">{ptBR.totalValue}</span>
            <span className="text-lg font-bold">{formatBRL(totalValue)}</span>
          </div>

          {isInstallment && installmentCount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {ptBR.installmentCount}
              </span>
              <span className="font-medium">
                {installmentCount}x de{" "}
                {formatBRL(totalValue / installmentCount)}
              </span>
            </div>
          )}

          <Separator />

          {/* Image thumbnails */}
          <div className="grid grid-cols-3 gap-2">
            {images
              .filter((img): img is CompressedImage => img !== null)
              .map((img, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg border"
                >
                  <img
                    src={img.preview}
                    alt={`Requisição ${i + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
