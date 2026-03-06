"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ptBR } from "@/lib/i18n/pt-BR";
import { maskCPFDisplay } from "@/lib/utils/cpf";
import type { Conveniado } from "@/lib/types/app.types";

interface Props {
  conveniados: Conveniado[];
  isLoading: boolean;
  selected: Conveniado | null;
  onSelect: (conveniado: Conveniado) => void;
}

export function StepConveniado({ conveniados, isLoading, selected, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = conveniados.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search.replace(/\D/g, ""))
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
        placeholder={ptBR.searchConveniado}
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
          filtered.map((conveniado) => (
            <Card
              key={conveniado.id}
              className={`cursor-pointer shadow-subtle transition-all duration-200 hover:shadow-md ${
                selected?.id === conveniado.id
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => onSelect(conveniado)}
            >
              <CardContent className="py-3">
                <p className="text-sm font-medium">{conveniado.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {maskCPFDisplay(conveniado.cpf)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
