"use client";

import { useEffect, useRef } from "react";

interface Props {
  isDirty: boolean;
  message?: string;
}

export function UnsavedChangesGuard({
  isDirty,
  message = "Você tem alterações não salvas. Deseja sair?",
}: Props) {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = message;
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [message]);

  return null;
}
