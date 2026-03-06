"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conveniado } from "@/lib/types/app.types";

export function useConveniados(convenioId?: string) {
  const [conveniados, setConveniados] = useState<Conveniado[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConveniados = useCallback(async (cId?: string) => {
    const id = cId ?? convenioId;
    if (!id) {
      setConveniados([]);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("conveniados")
      .select("*")
      .eq("convenio_id", id)
      .eq("active", true)
      .order("full_name");
    setConveniados(data ?? []);
    setIsLoading(false);
  }, [convenioId]);

  return { conveniados, isLoading, fetchConveniados };
}
