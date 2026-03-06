"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { conveniadoImportRowSchema } from "@/lib/validations/conveniado.schema";
import { importConveniados } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ParsedRow = {
  full_name: string;
  cpf: string;
  convenio_cnpj: string;
  convenio_id: string;
  valid: boolean;
  error?: string;
};

export default function ImportConveniadosPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [convenioMap, setConvenioMap] = useState<
    Map<string, { id: string; name: string }>
  >(new Map());
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchConvenios = useCallback(async () => {
    const { data } = await supabase
      .from("convenios")
      .select("id, company_name, cnpj")
      .eq("active", true);
    const map = new Map<string, { id: string; name: string }>();
    (data ?? []).forEach((c) => {
      map.set(c.cnpj, { id: c.id, name: c.company_name });
    });
    setConvenioMap(map);
  }, [supabase]);

  useEffect(() => {
    fetchConvenios();
  }, [fetchConvenios]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const dataLines = lines.slice(1);

      const parsed: ParsedRow[] = dataLines.map((line) => {
        const [full_name, cpf, convenio_cnpj] = line
          .split(";")
          .map((s) => s.trim());

        const rawCnpj = (convenio_cnpj ?? "").replace(/\D/g, "");
        const matchedConvenio = convenioMap.get(rawCnpj);

        const rowResult = conveniadoImportRowSchema.safeParse({
          full_name,
          cpf,
          convenio_cnpj: rawCnpj,
        });

        let valid = rowResult.success && !!matchedConvenio;
        let error = !rowResult.success
          ? rowResult.error.issues[0]?.message
          : !matchedConvenio
          ? "Convênio não encontrado"
          : undefined;

        return {
          full_name: full_name ?? "",
          cpf: cpf ?? "",
          convenio_cnpj: convenio_cnpj ?? "",
          convenio_id: matchedConvenio?.id ?? "",
          valid,
          error,
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
    const result = await importConveniados(
      validRows.map((r) => ({
        full_name: r.full_name,
        cpf: r.cpf,
        convenio_id: r.convenio_id,
      }))
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
    router.push("/admin/conveniados");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/conveniados">
          <Button variant="ghost" size="sm">
            ← {ptBR.back}
          </Button>
        </Link>
        <h2 className="text-xl font-bold">{ptBR.importConveniados}</h2>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-sm">
            Formato esperado: CSV com separador{" "}
            <code className="rounded bg-muted px-1">;</code>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Colunas: <strong>nome_completo;cpf;cnpj_convenio</strong>
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
                      <th className="py-2">Nome</th>
                      <th className="py-2">CPF</th>
                      <th className="py-2">Convênio CNPJ</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{row.full_name}</td>
                        <td className="py-2">{row.cpf}</td>
                        <td className="py-2">{row.convenio_cnpj}</td>
                        <td className="py-2">
                          {row.valid ? (
                            <Badge variant="default">OK</Badge>
                          ) : (
                            <Badge variant="destructive">{row.error}</Badge>
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
              disabled={
                isImporting || rows.filter((r) => r.valid).length === 0
              }
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
