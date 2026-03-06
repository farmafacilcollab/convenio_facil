"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { convenioImportRowSchema } from "@/lib/validations/convenio.schema";
import { importConvenios } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ParsedRow = {
  company_name: string;
  cnpj: string;
  valid: boolean;
  error?: string;
};

export default function ImportConveniosPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());

      // Skip header
      const dataLines = lines.slice(1);
      const parsed: ParsedRow[] = dataLines.map((line) => {
        const [company_name, cnpj] = line.split(";").map((s) => s.trim());
        const result = convenioImportRowSchema.safeParse({
          company_name,
          cnpj,
        });
        return {
          company_name: company_name ?? "",
          cnpj: cnpj ?? "",
          valid: result.success,
          error: result.success
            ? undefined
            : result.error.issues[0]?.message,
        };
      });

      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("Nenhum registro válido para importar");
      return;
    }

    setIsImporting(true);
    const result = await importConvenios(
      validRows.map((r) => ({ company_name: r.company_name, cnpj: r.cnpj }))
    );
    setIsImporting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `${result.imported} ${ptBR.csvRowsImported}${
        result.errors > 0 ? `, ${result.errors} ${ptBR.csvRowsError}` : ""
      }`
    );
    router.push("/admin/convenios");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/convenios">
          <Button variant="ghost" size="sm">
            ← {ptBR.back}
          </Button>
        </Link>
        <h2 className="text-xl font-bold">{ptBR.importConvenios}</h2>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-sm">
            Formato esperado: CSV com separador{" "}
            <code className="rounded bg-muted px-1">;</code>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Colunas: <strong>razao_social;cnpj</strong>
          </p>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
          />
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle className="text-sm">
                {ptBR.csvPreview} — {rows.length} registros (
                {rows.filter((r) => r.valid).length} válidos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2">Razão Social</th>
                      <th className="py-2">CNPJ</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{row.company_name}</td>
                        <td className="py-2">{row.cnpj}</td>
                        <td className="py-2">
                          {row.valid ? (
                            <Badge variant="default">OK</Badge>
                          ) : (
                            <Badge variant="destructive">
                              {row.error}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleImport}
              disabled={isImporting || rows.filter((r) => r.valid).length === 0}
            >
              {isImporting ? ptBR.csvImporting : ptBR.csvImport}{" "}
              ({rows.filter((r) => r.valid).length} registros)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
