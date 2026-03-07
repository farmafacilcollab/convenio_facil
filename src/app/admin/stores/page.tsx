import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "@/lib/i18n/pt-BR";
import { formatCNPJ } from "@/lib/utils/cnpj";
import { format } from "date-fns";
import { ptBR as datePtBR } from "date-fns/locale";

export default async function StoresPage() {
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("name");

  const { data: allSales } = await supabase
    .from("sales")
    .select("id, store_id, created_at");

  const storesWithStats = (stores ?? []).map((store) => {
    const storeSales = (allSales ?? []).filter(
      (s) => s.store_id === store.id
    );
    const lastSale = storeSales.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      ...store,
      salesCount: storeSales.length,
      lastSaleDate: lastSale?.created_at ?? null,
    };
  });

  return (
    <div className="animate-ios-fade-in space-y-6">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.stores}</h2>

      <div className="space-y-3">
        {storesWithStats.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {ptBR.noResults}
          </p>
        ) : (
          storesWithStats.map((store) => (
            <Card key={store.id} className="press-scale shadow-[var(--shadow-card)]">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCNPJ(store.cnpj)} • {store.slug}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {store.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={store.active ? "default" : "secondary"}>
                      {store.active ? ptBR.active : ptBR.inactive}
                    </Badge>
                    <p className="mt-1 text-sm font-semibold">
                      {store.salesCount} vendas
                    </p>
                    {store.lastSaleDate && (
                      <p className="text-xs text-muted-foreground">
                        {ptBR.lastActivity}:{" "}
                        {format(
                          new Date(store.lastSaleDate),
                          "dd/MM/yyyy HH:mm",
                          { locale: datePtBR }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
