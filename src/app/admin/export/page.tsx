"use client";

import { useState } from "react";
import type { ExportType } from "@/lib/types/app.types";
import type { ExportData, ExportImageData } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportPreview } from "@/components/export/ExportPreview";
import { fetchExportData } from "./actions";
import { generatePdf } from "@/lib/export/generatePdf";
import { generateXlsx } from "@/lib/export/generateXlsx";
import { generateZip } from "@/lib/export/generateZip";
import { ptBR } from "@/lib/i18n/pt-BR";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { useConvenios } from "@/hooks/useConvenios";

export default function ExportPage() {
  const { convenios, isLoading: isLoadingConvenios } = useConvenios();
  const [convenioId, setConvenioId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportType, setExportType] = useState<ExportType>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [preview, setPreview] = useState<ExportData | null>(null);
  const [imageCount, setImageCount] = useState(0);

  const handleExport = async () => {
    if (!convenioId || !dateFrom || !dateTo) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsExporting(true);
    setPreview(null);

    const result = await fetchExportData(
      convenioId,
      dateFrom,
      dateTo,
      exportType
    );

    if ("error" in result) {
      toast.error(result.error);
      setIsExporting(false);
      return;
    }

    const { data, imageData } = result;
    setPreview(data);
    setImageCount(imageData?.length ?? 0);

    try {
      const convenioSlug = data.convenioName
        .replace(/[^a-zA-Z0-9À-ú]/g, "_")
        .toLowerCase();
      const dateStr = `${dateFrom}_${dateTo}`;

      if (exportType === "pdf") {
        const blob = generatePdf(data);
        saveAs(blob, `relatorio_${convenioSlug}_${dateStr}.pdf`);
      } else if (exportType === "xlsx") {
        const blob = generateXlsx(data);
        saveAs(blob, `relatorio_${convenioSlug}_${dateStr}.xlsx`);
      } else if (exportType === "images" && imageData) {
        const imgExportData: ExportImageData = { ...data, images: imageData };
        const blob = await generateZip(imgExportData);
        saveAs(blob, `imagens_${convenioSlug}_${dateStr}.zip`);
      }

      toast.success(ptBR.exportSuccess);
    } catch {
      toast.error(ptBR.exportError);
    }

    setIsExporting(false);
  };

  return (
    <div className="animate-ios-fade-in space-y-6">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.exportTitle}</h2>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">{ptBR.selectDateRange}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{ptBR.convenio}</Label>
            <Select value={convenioId} onValueChange={setConvenioId}>
              <SelectTrigger disabled={isLoadingConvenios}>
                <SelectValue placeholder={isLoadingConvenios ? "Carregando..." : "Selecione o convênio"} />
              </SelectTrigger>
              <SelectContent>
                {convenios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{ptBR.dateFrom}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{ptBR.dateTo}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="flex gap-2">
              <Button
                variant={exportType === "pdf" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportType("pdf")}
                type="button"
              >
                {ptBR.exportPdf}
              </Button>
              <Button
                variant={exportType === "xlsx" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportType("xlsx")}
                type="button"
              >
                {ptBR.exportXlsx}
              </Button>
              <Button
                variant={exportType === "images" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportType("images")}
                type="button"
              >
                {ptBR.exportImages}
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? ptBR.exporting : ptBR.export}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <ExportPreview
          data={preview}
          imageCount={exportType === "images" ? imageCount : undefined}
        />
      )}
    </div>
  );
}
