"use client";

import { useEffect, useCallback } from "react";

interface Props {
  isDirty: boolean;
  message?: string;
}

export function UnsavedChangesGuard({
  isDirty,
  message = "Você tem alterações não salvas. Deseja sair?",
}: Props) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
      }
    },
    [isDirty, message]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload]);

  return null;
}
