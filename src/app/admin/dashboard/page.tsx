import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatBRL } from "@/lib/utils/currency";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch total sales count and value
  const { data: salesStats } = await supabase
    .from("sales")
    .select("id, total_value, store_id, convenio_id");

  const totalSales = salesStats?.length ?? 0;
  const totalValue = salesStats?.reduce(
    (sum, s) => sum + Number(s.total_value),
    0
  ) ?? 0;

  // Sales by store
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("active", true);

  const salesByStore = (stores ?? []).map((store) => {
    const storeSales = salesStats?.filter((s) => s.store_id === store.id) ?? [];
    return {
      name: store.name,
      count: storeSales.length,
      value: storeSales.reduce((sum, s) => sum + Number(s.total_value), 0),
    };
  });

  // Sales by convenio
  const { data: convenios } = await supabase
    .from("convenios")
    .select("id, company_name");

  const salesByConvenio = (convenios ?? []).map((c) => {
    const cSales = salesStats?.filter((s) => s.convenio_id === c.id) ?? [];
    return {
      name: c.company_name,
      count: cSales.length,
      value: cSales.reduce((sum, s) => sum + Number(s.total_value), 0),
    };
  });

  // Pending sales count
  const { count: pendingCount } = await supabase
    .from("sales")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="animate-ios-fade-in space-y-6">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.dashboard}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {ptBR.totalSales}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSales}</p>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(totalValue)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {ptBR.pending}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {pendingCount ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Store */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">{ptBR.salesByStore}</CardTitle>
        </CardHeader>
        <CardContent>
          {salesByStore.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ptBR.noResults}</p>
          ) : (
            <div className="space-y-3">
              {salesByStore.map((store) => (
                <div
                  key={store.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{store.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {store.count} vendas
                    </span>
                    <span className="font-semibold">
                      {formatBRL(store.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Convenio */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">{ptBR.salesByConvenio}</CardTitle>
        </CardHeader>
        <CardContent>
          {salesByConvenio.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ptBR.noResults}</p>
          ) : (
            <div className="space-y-3">
              {salesByConvenio
                .filter((c) => c.count > 0)
                .sort((a, b) => b.value - a.value)
                .map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {c.count} vendas
                      </span>
                      <span className="font-semibold">
                        {formatBRL(c.value)}
                      </span>
                    </div>
                  </div>
                ))}
              {salesByConvenio.every((c) => c.count === 0) && (
                <p className="text-sm text-muted-foreground">
                  {ptBR.noResults}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
