"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conveniado } from "@/lib/types/app.types";

export function useConveniados(convenioId?: string) {
  const [conveniados, setConveniados] = useState<Conveniado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabaseRef = useRef(createClient());

  const fetchConveniados = useCallback(async (cId?: string) => {
    const id = cId ?? convenioId;
    if (!id) {
      setConveniados([]);
      return;
    }

    setIsLoading(true);
    const { data } = await supabaseRef.current
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
