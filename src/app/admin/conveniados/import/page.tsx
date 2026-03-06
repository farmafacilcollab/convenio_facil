"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { validateCPF, maskCPFDisplay } from "@/lib/utils/cpf";
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

type ValidRow = { full_name: string; cpf: string };

type Step = "upload" | "preview" | "result";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 5000;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];

function normalizeForCompare(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

  const processFile = useCallback((file: File) => {
    // Validar extensão
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error(ptBR.xlsxErrorInvalidFile);
      return;
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      toast.error(ptBR.xlsxErrorFileSize);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Ler como array de arrays (raw), incluindo header
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (rawData.length < 2) {
          toast.error(ptBR.xlsxErrorNoData);
          return;
        }

        // Remover header (primeira linha)
        const dataRows = rawData.slice(1).filter((row) => {
          // Ignorar linhas completamente vazias
          return row.some((cell) => String(cell ?? "").trim() !== "");
        });

        if (dataRows.length === 0) {
          toast.error(ptBR.xlsxErrorNoData);
          return;
        }

        if (dataRows.length > MAX_ROWS) {
          toast.error(ptBR.xlsxErrorMaxRows);
          return;
        }

        // Detectar convênio da primeira linha de dados (Coluna A)
        const firstConvenio = normalizeForCompare(String(dataRows[0][0] ?? ""));
        if (!firstConvenio) {
          toast.error(ptBR.xlsxErrorNoData);
          return;
        }

        // Validar que todas as linhas têm o mesmo convênio
        for (let i = 0; i < dataRows.length; i++) {
          const rowConvenio = normalizeForCompare(String(dataRows[i][0] ?? ""));
          if (rowConvenio && rowConvenio !== firstConvenio) {
            toast.error(ptBR.xlsxErrorMultipleConvenios);
            return;
          }
        }

        // Processar linhas: ler apenas colunas A (convênio), B (nome), C (CPF)
        const valid: ValidRow[] = [];
        let ignored = 0;
        const seenCpfs = new Set<string>();

        for (const row of dataRows) {
          const fullName = String(row[1] ?? "").trim();
          const cpfRaw = String(row[2] ?? "").replace(/\D/g, "");

          // Validar CPF
          if (!cpfRaw || !validateCPF(cpfRaw)) {
            ignored++;
            continue;
          }

          // Nome mínimo
          if (fullName.length < 2) {
            ignored++;
            continue;
          }

          // Deduplicar CPFs
          if (seenCpfs.has(cpfRaw)) {
            ignored++;
            continue;
          }
          seenCpfs.add(cpfRaw);

          valid.push({ full_name: fullName, cpf: cpfRaw });
        }

        if (valid.length === 0) {
          toast.error(ptBR.xlsxErrorNoData);
          return;
        }

        // Usar o nome original (não normalizado) para exibição
        const originalConvenioName = String(dataRows[0][0] ?? "").trim();

        setValidRows(valid);
        setIgnoredCount(ignored);
        setConvenioName(originalConvenioName);
        setStep("preview");

        // Verificar se convênio existe (via preview)
        previewSyncConveniados(valid, originalConvenioName).then((res) => {
          if ("error" in res) return;
          setConvenioFound(res.convenioFound);
        });
      } catch {
        toast.error(ptBR.xlsxErrorParsing);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
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

      {/* ETAPA 1 — Upload */}
      {step === "upload" && (
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="text-sm">{ptBR.xlsxUploadTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {ptBR.xlsxUploadDesc}
            </p>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 text-muted-foreground"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              <p className="text-sm font-medium">{ptBR.xlsxDragDrop}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ptBR.xlsxAcceptedFormats}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>
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
