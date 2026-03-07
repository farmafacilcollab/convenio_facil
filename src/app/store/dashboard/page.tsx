import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatBRL } from "@/lib/utils/currency";
import { format } from "date-fns";
import { ptBR as datePtBR } from "date-fns/locale";
import Link from "next/link";

export default async function StoreDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single();

  if (!profile?.store_id) return null;

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's sales
  const { data: todaySales } = await supabase
    .from("sales")
    .select("id, total_value, sale_date, created_at, conveniado:conveniados(full_name), convenio:convenios(company_name)")
    .eq("store_id", profile.store_id)
    .eq("sale_date", today)
    .order("created_at", { ascending: false });

  // Fetch recent sales (last 10)
  const { data: recentSales } = await supabase
    .from("sales")
    .select("id, total_value, sale_date, status, created_at, conveniado:conveniados(full_name), convenio:convenios(company_name)")
    .eq("store_id", profile.store_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const todayCount = todaySales?.length ?? 0;
  const todayTotal = todaySales?.reduce((sum, s) => sum + Number(s.total_value), 0) ?? 0;

  return (
    <div className="animate-ios-fade-in space-y-6">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.dashboard}</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {ptBR.todaySales}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[28px] font-bold">{todayCount}</p>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {ptBR.totalValueToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[28px] font-bold">{formatBRL(todayTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <div>
        <h3 className="mb-4 text-base font-semibold">{ptBR.recentSales}</h3>
        {(!recentSales || recentSales.length === 0) ? (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {ptBR.noResults}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => {
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
    </div>
  );
}
