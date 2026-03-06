"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-subtle">
        <CardHeader>
          <CardTitle className="text-destructive">
            Erro ao carregar a página
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "Ocorreu um erro inesperado. Tente novamente."}
          </p>
          <div className="flex gap-3">
            <Button onClick={reset}>Tentar novamente</Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/dashboard")}
            >
              Voltar ao painel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
