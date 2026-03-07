"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ptBR } from "@/lib/i18n/pt-BR";
import { maskCPFDisplay } from "@/lib/utils/cpf";
import type { Conveniado } from "@/lib/types/app.types";

const MAX_VISIBLE = 20;

interface Props {
  conveniados: Conveniado[];
  isLoading: boolean;
  selected: Conveniado | null;
  onSelect: (conveniado: Conveniado) => void;
}

export function StepConveniado({ conveniados, isLoading, selected, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return conveniados;
    const lower = search.toLowerCase();
    const digits = search.replace(/\D/g, "");
    return conveniados.filter(
      (c) =>
        c.full_name.toLowerCase().includes(lower) ||
        (digits && c.cpf.includes(digits))
    );
  }, [conveniados, search]);

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
        placeholder={ptBR.searchConveniado}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-12 rounded-xl"
      />

      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {ptBR.noResults}
          </p>
        ) : (
          <>
            {filtered.slice(0, MAX_VISIBLE).map((conveniado) => (
              <Card
                key={conveniado.id}
                className={`cursor-pointer press-scale shadow-[var(--shadow-card)] transition-all duration-150 ${
                  selected?.id === conveniado.id
                    ? "ring-2 ring-primary shadow-[var(--shadow-elevated)]"
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
            ))}
            {filtered.length > MAX_VISIBLE && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Digite para filtrar — {filtered.length - MAX_VISIBLE} conveniados ocultos
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
