"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatCNPJ } from "@/lib/utils/cnpj";
import type { Convenio } from "@/lib/types/app.types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  convenios: Convenio[];
  isLoading: boolean;
  selected: Convenio | null;
  onSelect: (convenio: Convenio) => void;
}

export function StepConvenio({ convenios, isLoading, selected, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = convenios.filter(
    (c) =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj ?? "").includes(search.replace(/\D/g, ""))
  );

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
          filtered.map((convenio) => (
            <Card
              key={convenio.id}
              className={`cursor-pointer shadow-subtle transition-all duration-200 hover:shadow-md ${
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
          ))
        )}
      </div>
    </div>
  );
}
