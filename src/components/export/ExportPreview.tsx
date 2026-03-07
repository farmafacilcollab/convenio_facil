"use client";

import { formatBRL } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExportData } from "@/lib/export";

interface ExportPreviewProps {
  data: ExportData;
  imageCount?: number;
}

export function ExportPreview({ data, imageCount }: ExportPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Resumo da Exportação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Convênio</span>
          <span className="font-medium">{data.convenioName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CNPJ</span>
          <span>{data.convenioCnpj}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Período</span>
          <span>
            {data.dateFrom} a {data.dateTo}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total de Vendas</span>
          <span className="font-semibold">{data.rows.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Total</span>
          <span className="text-lg font-bold">
            {formatBRL(data.totalValue)}
          </span>
        </div>
        {imageCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Imagens</span>
            <span className="font-semibold">{imageCount}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
