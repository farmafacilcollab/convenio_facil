import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatBRL } from "@/lib/utils/currency";
import { formatCNPJ } from "@/lib/utils/cnpj";
import { maskCPFDisplay } from "@/lib/utils/cpf";
import { format } from "date-fns";
import { ptBR as datePtBR } from "date-fns/locale";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select(
      `
      *,
      store:stores(name, slug),
      convenio:convenios(company_name, cnpj),
      conveniado:conveniados(full_name, cpf),
      sale_images(id, installment_number, storage_path, file_size_kb)
    `
    )
    .eq("id", id)
    .single();

  if (!sale) notFound();

  const store = Array.isArray(sale.store) ? sale.store[0] : sale.store;
  const convenio = Array.isArray(sale.convenio) ? sale.convenio[0] : sale.convenio;
  const conveniado = Array.isArray(sale.conveniado) ? sale.conveniado[0] : sale.conveniado;

  // Generate signed URLs for images
  const imagesWithUrls = await Promise.all(
    (sale.sale_images ?? []).map(async (img: { id: string; installment_number: number | null; storage_path: string; file_size_kb: number }) => {
      const { data } = await supabase.storage
        .from("requisitions")
        .createSignedUrl(img.storage_path, 3600);
      return { ...img, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/store/sales">
          <Button variant="ghost" size="sm">
            ← {ptBR.back}
          </Button>
        </Link>
        <h2 className="text-xl font-bold">Detalhes da Venda</h2>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {ptBR.saleId}
            </CardTitle>
            <Badge
              variant={
                sale.status === "pending"
                  ? "secondary"
                  : sale.status === "exported"
                  ? "default"
                  : "outline"
              }
            >
              {sale.status === "pending"
                ? ptBR.pending
                : sale.status === "exported"
                ? ptBR.exported
                : ptBR.closed}
            </Badge>
          </div>
          <p className="font-mono text-xs">{sale.id}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{ptBR.storeName}</span>
              <span className="font-medium">{store?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{ptBR.convenio}</span>
              <span className="text-right font-medium">
                {convenio?.company_name ?? "—"}
                <br />
                <span className="text-xs text-muted-foreground">
                  {convenio ? formatCNPJ(convenio.cnpj) : ""}
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{ptBR.conveniados}</span>
              <span className="text-right font-medium">
                {conveniado?.full_name ?? "—"}
                <br />
                <span className="text-xs text-muted-foreground">
                  {conveniado ? maskCPFDisplay(conveniado.cpf) : ""}
                </span>
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{ptBR.saleDate}</span>
              <span className="font-medium">
                {format(new Date(sale.sale_date + "T12:00:00"), "dd/MM/yyyy", {
                  locale: datePtBR,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{ptBR.totalValue}</span>
              <span className="text-lg font-bold">
                {formatBRL(Number(sale.total_value))}
              </span>
            </div>
            {sale.is_installment && sale.installment_count && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parcelas</span>
                <span className="font-medium">
                  {sale.installment_count}x de{" "}
                  {formatBRL(
                    Number(sale.total_value) / sale.installment_count
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      {imagesWithUrls.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Requisições</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {imagesWithUrls.map((img) => (
              <Card key={img.id} className="overflow-hidden shadow-subtle">
                {img.url ? (
                  <img
                    src={img.url}
                    alt={`Requisição ${img.installment_number ?? "Única"}`}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">
                    Imagem indisponível
                  </div>
                )}
                <CardContent className="py-2">
                  <p className="text-xs text-muted-foreground">
                    {img.installment_number
                      ? `Parcela ${img.installment_number}`
                      : "Pagamento Único"}{" "}
                    • {img.file_size_kb}KB
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
