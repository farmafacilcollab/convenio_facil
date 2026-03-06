"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatCNPJ } from "@/lib/utils/cnpj";
import type { Convenio } from "@/lib/types/app.types";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_VISIBLE = 20;

interface Props {
  convenios: Convenio[];
  isLoading: boolean;
  selected: Convenio | null;
  onSelect: (convenio: Convenio) => void;
}

export function StepConvenio({ convenios, isLoading, selected, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return convenios;
    const lower = search.toLowerCase();
    const digits = search.replace(/\D/g, "");
    return convenios.filter(
      (c) =>
        c.company_name.toLowerCase().includes(lower) ||
        (digits && (c.cnpj ?? "").includes(digits))
    );
  }, [convenios, search]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        ref={inputRef}
        placeholder={ptBR.searchConvenio}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-12"
      />

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {ptBR.noResults}
          </p>
        ) : (
          <>
            {filtered.slice(0, MAX_VISIBLE).map((convenio) => (
              <Card
                key={convenio.id}
                className={`cursor-pointer shadow-subtle transition-all duration-150 hover:shadow-md ${
                  selected?.id === convenio.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => onSelect(convenio)}
              >
                <CardContent className="py-3">
                  <p className="text-sm font-medium">{convenio.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {convenio.cnpj ? formatCNPJ(convenio.cnpj) : "CNPJ não informado"}
                  </p>
                </CardContent>
              </Card>
            ))}
            {filtered.length > MAX_VISIBLE && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Digite para filtrar — {filtered.length - MAX_VISIBLE} convênios ocultos
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
