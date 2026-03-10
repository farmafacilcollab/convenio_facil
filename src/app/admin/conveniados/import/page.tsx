"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { validateCPF, maskCPFDisplay } from "@/lib/utils/cpf";
import { validateCNPJ, formatCNPJ } from "@/lib/utils/cnpj";
import {
  previewSyncConveniados,
  executeSyncConveniados,
  type PreviewSyncResult,
  type ExecuteSyncResult,
} from "../actions";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ValidRow = { full_name: string; cpf?: string; cnpj?: string };

type Step = "upload" | "preview" | "result";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 5000;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".txt"];

const CPF_REGEX = /\d{3}\.\d{3}\.\d{3}-\d{2}/;

function normalizeForCompare(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Parser para relatório TXT do WebPharma (formato fixo).
 * Pula cabeçalho até a linha de traços (----), extrai convênio e conveniados.
 */
function parseTxtWebPharma(text: string): {
  convenioName: string;
  rows: ValidRow[];
  ignored: number;
} {
  const lines = text.split(/\r?\n/);
  let convenioName = "";
  const rows: ValidRow[] = [];
  let ignored = 0;
  const seenCpfs = new Set<string>();

  // Encontrar separador de traços (----) para pular cabeçalho
  let dataStart = 0;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (/^-{10,}/.test(lines[i].trim())) {
      dataStart = i + 1;
      break;
    }
  }
  // Fallback: pular as primeiras 10 linhas
  if (dataStart === 0) dataStart = Math.min(10, lines.length);

  for (let i = dataStart; i < lines.length; i++) {
    const trimmed = lines[i].trimEnd();
    if (!trimmed) continue;

    // Ignorar rodapé e separadores
    if (/^={3,}/.test(trimmed)) continue;
    if (/Registros Listados/i.test(trimmed)) continue;

    // Linha do convênio: tem "ATIVO" mas não tem CPF
    if (/\bATIVO\b/i.test(trimmed) && !CPF_REGEX.test(trimmed)) {
      const name = trimmed.split(/\s{2,}/)[0].trim();
      if (name && !convenioName) convenioName = name;
      continue;
    }

    // Linha de conveniado: contém CPF no formato XXX.XXX.XXX-XX
    const cpfMatch = trimmed.match(CPF_REGEX);
    if (cpfMatch) {
      const cpfRaw = cpfMatch[0].replace(/\D/g, "");
      const ativoIdx = trimmed.indexOf("ATIVO");
      const fullName =
        ativoIdx > 0
          ? trimmed.substring(0, ativoIdx).trim()
          : trimmed.substring(0, trimmed.indexOf(cpfMatch[0])).trim();

      if (!validateCPF(cpfRaw)) { ignored++; continue; }
      if (fullName.length < 2) { ignored++; continue; }
      if (seenCpfs.has(cpfRaw)) { ignored++; continue; }
      seenCpfs.add(cpfRaw);

      rows.push({ full_name: fullName, cpf: cpfRaw });
    }
  }

  return { convenioName, rows, ignored };
}

function downloadCsvTemplate() {
  const BOM = "\uFEFF";
  const content =
    BOM +
    "Convênio;Nome Completo;CPF\n" +
    "FARMAFACIL;MARIA DA SILVA;123.456.789-09\n" +
    "FARMAFACIL;JOSE DOS SANTOS;987.654.321-00\n";
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo_conveniados.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadXlsxTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["Convênio", "Nome Completo", "CPF"],
    ["FARMAFACIL", "MARIA DA SILVA", "123.456.789-09"],
    ["FARMAFACIL", "JOSE DOS SANTOS", "987.654.321-00"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 20 }, { wch: 35 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, "Conveniados");
  XLSX.writeFile(wb, "modelo_conveniados.xlsx");
}

export default function ImportConveniadosXlsxPage() {
  const [step, setStep] = useState<Step>("upload");
  const [validRows, setValidRows] = useState<ValidRow[]>([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [convenioName, setConvenioName] = useState("");
  const [convenioFound, setConvenioFound] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMassRemoval, setShowMassRemoval] = useState(false);
  const [massRemovalCount, setMassRemovalCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{
    added: number;
    updated: number;
    reactivated: number;
    deactivated: number;
    ignored: number;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setValidRows([]);
    setIgnoredCount(0);
    setConvenioName("");
    setConvenioFound(false);
    setResult(null);
    setShowMassRemoval(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyParsedData = useCallback(
    (convenio: string, valid: ValidRow[], ignored: number) => {
      setValidRows(valid);
      setIgnoredCount(ignored);
      setConvenioName(convenio);
      setStep("preview");

      previewSyncConveniados(valid, convenio)
        .then((res) => {
          if ("error" in res) {
            toast.error(res.error);
            return;
          }
          setConvenioFound(res.convenioFound);
        })
        .catch(() => toast.error("Erro ao verificar convênio. Tente novamente."));
    },
    []
  );

  const processCsv = useCallback(
    (text: string) => {
      const clean = text.replace(/^\uFEFF/, "");
      const lines = clean.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      const dataLines = lines.slice(1);
      if (dataLines.length > MAX_ROWS) {
        toast.error(ptBR.xlsxErrorMaxRows);
        return;
      }

      const firstConvenio = normalizeForCompare(
        dataLines[0].split(";")[0]?.trim() ?? ""
      );
      if (!firstConvenio) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      const valid: ValidRow[] = [];
      let ignored = 0;
      const seenCpfs = new Set<string>();

      for (const line of dataLines) {
        const parts = line.split(";");
        const rowConvenio = normalizeForCompare(parts[0]?.trim() ?? "");
        const fullName = parts[1]?.trim() ?? "";
        const cpfRaw = (parts[2]?.trim() ?? "").replace(/\D/g, "");

        if (rowConvenio && rowConvenio !== firstConvenio) {
          toast.error(ptBR.xlsxErrorMultipleConvenios);
          return;
        }
        if (!cpfRaw || !validateCPF(cpfRaw)) { ignored++; continue; }
        if (fullName.length < 2) { ignored++; continue; }
        if (seenCpfs.has(cpfRaw)) { ignored++; continue; }
        seenCpfs.add(cpfRaw);
        valid.push({ full_name: fullName, cpf: cpfRaw });
      }

      if (valid.length === 0) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      const originalName = dataLines[0].split(";")[0]?.trim() ?? "";
      applyParsedData(originalName, valid, ignored);
    },
    [applyParsedData]
  );

  const processXlsx = useCallback(
    (buffer: ArrayBuffer) => {
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      if (rawData.length < 2) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      const dataRows = rawData.slice(1).filter((row) =>
        row.some((cell) => String(cell ?? "").trim() !== "")
      );

      if (dataRows.length === 0) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      if (dataRows.length > MAX_ROWS) {
        toast.error(ptBR.xlsxErrorMaxRows);
        return;
      }

      const firstConvenio = normalizeForCompare(String(dataRows[0][0] ?? ""));
      if (!firstConvenio) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      for (let i = 0; i < dataRows.length; i++) {
        const rowConvenio = normalizeForCompare(String(dataRows[i][0] ?? ""));
        if (rowConvenio && rowConvenio !== firstConvenio) {
          toast.error(ptBR.xlsxErrorMultipleConvenios);
          return;
        }
      }

      const valid: ValidRow[] = [];
      let ignored = 0;
      const seenCpfs = new Set<string>();

      for (const row of dataRows) {
        const fullName = String(row[1] ?? "").trim();
        const cpfRaw = String(row[2] ?? "").replace(/\D/g, "");

        if (!cpfRaw || !validateCPF(cpfRaw)) { ignored++; continue; }
        if (fullName.length < 2) { ignored++; continue; }
        if (seenCpfs.has(cpfRaw)) { ignored++; continue; }
        seenCpfs.add(cpfRaw);

        valid.push({ full_name: fullName, cpf: cpfRaw });
      }

      if (valid.length === 0) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      const originalConvenioName = String(dataRows[0][0] ?? "").trim();
      applyParsedData(originalConvenioName, valid, ignored);
    },
    [applyParsedData]
  );

  const processTxt = useCallback(
    (text: string) => {
      const { convenioName: name, rows, ignored } = parseTxtWebPharma(text);

      if (!name) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      if (rows.length === 0) {
        toast.error(ptBR.xlsxErrorNoData);
        return;
      }

      if (rows.length > MAX_ROWS) {
        toast.error(ptBR.xlsxErrorMaxRows);
        return;
      }

      applyParsedData(name, rows, ignored);
    },
    [applyParsedData]
  );

  const processFile = useCallback(
    (file: File) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        toast.error(ptBR.importErrorInvalidFile);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(ptBR.xlsxErrorFileSize);
        return;
      }

      if (ext === ".csv") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            processCsv(ev.target?.result as string);
          } catch {
            toast.error(ptBR.xlsxErrorParsing);
          }
        };
        reader.readAsText(file, "utf-8");
      } else if (ext === ".txt") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            processTxt(ev.target?.result as string);
          } catch {
            toast.error(ptBR.xlsxErrorParsing);
          }
        };
        reader.readAsText(file, "iso-8859-1");
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            processXlsx(ev.target?.result as ArrayBuffer);
          } catch {
            toast.error(ptBR.xlsxErrorParsing);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
    [processCsv, processXlsx, processTxt]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const selectFileOfType = (type: "csv" | "xlsx" | "txt") => {
    if (!fileRef.current) return;
    const accepts = { csv: ".csv", xlsx: ".xlsx,.xls", txt: ".txt" };
    fileRef.current.accept = accepts[type];
    fileRef.current.click();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);

    // Primeiro, obter preview para verificar remoção em massa
    const preview = await previewSyncConveniados(validRows, convenioName);
    if ("error" in preview) {
      toast.error(preview.error);
      setIsSyncing(false);
      return;
    }

    // Verificar se há remoção em massa (>30%)
    if (
      preview.totalActive > 0 &&
      preview.toDeactivate / preview.totalActive > 0.3
    ) {
      setMassRemovalCount(preview.toDeactivate);
      setShowMassRemoval(true);
      setIsSyncing(false);
      return;
    }

    await executeSync();
  };

  const executeSync = async () => {
    setIsSyncing(true);
    const res = await executeSyncConveniados(validRows, convenioName);

    setIsSyncing(false);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    setResult({
      added: res.added,
      updated: res.updated,
      reactivated: res.reactivated,
      deactivated: res.deactivated,
      ignored: ignoredCount + res.ignored.length,
    });
    setStep("result");
    toast.success(ptBR.csvSuccess);
  };

  const handleConfirmMassRemoval = async () => {
    setShowMassRemoval(false);
    await executeSync();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/conveniados">
          <Button variant="ghost" size="sm">
            ← {ptBR.back}
          </Button>
        </Link>
        <h2 className="text-xl font-bold">{ptBR.xlsxUploadTitle}</h2>
      </div>

      {/* ETAPA 1 — Seleção de formato e Upload */}
      {step === "upload" && (
        <>
          <p className="text-sm text-muted-foreground">
            Selecione o formato do arquivo para importar conveniados.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {/* CSV */}
            <Card className="shadow-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  📄 Planilha CSV
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Separador: ponto-e-vírgula (;)
                  <br />
                  Colunas: Convênio, Nome Completo, CPF
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCsvTemplate}
                >
                  📥 Baixar Modelo CSV
                </Button>
                <Button size="sm" onClick={() => selectFileOfType("csv")}>
                  Selecionar Arquivo .csv
                </Button>
              </CardContent>
            </Card>

            {/* XLSX */}
            <Card className="shadow-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  📊 Planilha Excel
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Colunas: Convênio, Nome Completo, CPF
                  <br />
                  Formatos: .xlsx, .xls
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadXlsxTemplate}
                >
                  📥 Baixar Modelo Excel
                </Button>
                <Button size="sm" onClick={() => selectFileOfType("xlsx")}>
                  Selecionar Arquivo .xlsx
                </Button>
              </CardContent>
            </Card>

            {/* TXT */}
            <Card className="shadow-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  📃 Relatório WebPharma
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Arquivo .txt exportado diretamente do sistema WebPharma. O
                  convênio é identificado automaticamente pelo nome.
                </p>
              </CardHeader>
              <CardContent>
                <Button size="sm" onClick={() => selectFileOfType("txt")}>
                  Selecionar Arquivo .txt
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Drag-drop alternativo */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = ".csv,.xlsx,.xls,.txt";
                fileRef.current.click();
              }
            }}
          >
            <p className="text-sm text-muted-foreground">
              Ou arraste qualquer arquivo aqui
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Formatos aceitos: .csv, .xlsx, .xls, .txt (máx. 5MB)
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {/* ETAPA 2 — Preview */}
      {step === "preview" && (
        <>
          <Card className="shadow-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm">
                  {ptBR.xlsxConvenioIdentified}
                </CardTitle>
                <span className="text-sm font-semibold">{convenioName}</span>
                <Badge variant={convenioFound ? "default" : "secondary"}>
                  {convenioFound
                    ? ptBR.xlsxConvenioFound
                    : ptBR.xlsxConvenioWillCreate}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle className="text-sm">
                {ptBR.xlsxPreview} — {validRows.length}{" "}
                {ptBR.xlsxValidRecords}
              </CardTitle>
              {ignoredCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ⚠️ {ignoredCount} {ptBR.xlsxIgnored}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2">{ptBR.fullName}</th>
                      <th className="py-2">{ptBR.cpf}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{row.full_name}</td>
                        <td className="py-2">{maskCPFDisplay(row.cpf)}</td>
                      </tr>
                    ))}
                    {validRows.length > 100 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="py-2 text-center text-xs text-muted-foreground"
                        >
                          ... e mais {validRows.length - 100} registros
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? ptBR.xlsxSyncing : ptBR.xlsxSyncButton}
                </Button>
                <Button variant="outline" onClick={resetState}>
                  {ptBR.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ETAPA 3 — Alerta de remoção em massa (AlertDialog) */}
      <AlertDialog open={showMassRemoval} onOpenChange={setShowMassRemoval}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ptBR.xlsxMassRemovalTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {ptBR.xlsxMassRemovalDesc.replace(
                "{count}",
                String(massRemovalCount)
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ptBR.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMassRemoval}>
              {ptBR.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ETAPA 4 — Resultado */}
      {step === "result" && result && (
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="text-sm">{ptBR.xlsxResult}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>
                  {result.added} {ptBR.xlsxAdded}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔄</span>
                <span>
                  {result.updated} {ptBR.xlsxUpdated}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>♻️</span>
                <span>
                  {result.reactivated} {ptBR.xlsxReactivated}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🗑️</span>
                <span>
                  {result.deactivated} {ptBR.xlsxDeactivated}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  {result.ignored} {ptBR.xlsxIgnored}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={resetState}>{ptBR.xlsxImportAnother}</Button>
              <Link href="/admin/conveniados">
                <Button variant="outline">{ptBR.xlsxBackToList}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
