import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatBRL } from "@/lib/utils/currency";
import { format } from "date-fns";
import { ptBR as datePtBR } from "date-fns/locale";
import Link from "next/link";

export default async function SalesListPage({
  searchParams,
}: {
  searchParams: Promise<{ convenio?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.store_id) return null;

  let query = supabase
    .from("sales")
    .select(
      "id, total_value, sale_date, status, is_installment, installment_count, created_at, conveniado:conveniados(full_name), convenio:convenios(company_name)"
    )
    .eq("store_id", profile.store_id)
    .order("created_at", { ascending: false });

  if (params.convenio) {
    query = query.eq("convenio_id", params.convenio);
  }
  if (params.from) {
    query = query.gte("sale_date", params.from);
  }
  if (params.to) {
    query = query.lte("sale_date", params.to);
  }

  const { data: sales } = await query.limit(100);

  return (
    <div className="animate-ios-fade-in space-y-6">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.sales}</h2>

      {(!sales || sales.length === 0) ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {ptBR.noResults}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const conveniadoName = Array.isArray(sale.conveniado)
              ? sale.conveniado[0]?.full_name
              : (sale.conveniado as { full_name: string } | null)?.full_name;
            const convenioName = Array.isArray(sale.convenio)
              ? sale.convenio[0]?.company_name
              : (sale.convenio as { company_name: string } | null)?.company_name;

            return (
              <Link key={sale.id} href={`/store/sales/${sale.id}`}>
                <Card className="press-scale shadow-[var(--shadow-card)] transition-shadow duration-200 active:shadow-[var(--shadow-elevated)]">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {conveniadoName ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {convenioName ?? "—"} •{" "}
                        {format(new Date(sale.sale_date), "dd/MM/yyyy", {
                          locale: datePtBR,
                        })}
                      </p>
                      {sale.is_installment && (
                        <p className="text-xs text-muted-foreground">
                          {sale.installment_count}x parcelas
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-semibold">
                        {formatBRL(Number(sale.total_value))}
                      </p>
                      <Badge
                        variant={
                          sale.status === "pending"
                            ? "secondary"
                            : sale.status === "exported"
                            ? "default"
                            : "outline"
                        }
                        className="text-[11px]"
                      >
                        {sale.status === "pending"
                          ? ptBR.pending
                          : sale.status === "exported"
                          ? ptBR.exported
                          : ptBR.closed}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
