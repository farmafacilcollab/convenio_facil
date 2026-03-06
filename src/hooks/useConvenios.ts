"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Convenio } from "@/lib/types/app.types";

export function useConvenios() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConvenios = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("convenios")
      .select("*")
      .eq("active", true)
      .order("company_name");
    setConvenios(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConvenios();
  }, [fetchConvenios]);

  return { convenios, isLoading, refetch: fetchConvenios };
}
