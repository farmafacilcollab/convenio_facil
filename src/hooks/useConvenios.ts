"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Convenio } from "@/lib/types/app.types";

export function useConvenios() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  const fetchConvenios = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabaseRef.current
        .from("convenios")
        .select("*")
        .eq("active", true)
        .order("company_name");
      setConvenios(data ?? []);
    } catch {
      setConvenios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConvenios();
  }, [fetchConvenios]);

  return { convenios, isLoading, refetch: fetchConvenios };
}
