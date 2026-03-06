"use server";

import { createClient } from "@/lib/supabase/server";
import { maskCPFDisplay } from "@/lib/utils/cpf";
import { formatCNPJ } from "@/lib/utils/cnpj";
import { format } from "date-fns";
import { ptBR as datePtBR } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import type { ExportRow, ExportData, ExportImageData } from "@/lib/export";
import type { ExportType } from "@/lib/types/app.types";

export async function fetchExportData(
  convenioId: string,
  dateFrom: string,
  dateTo: string,
  exportType: ExportType
): Promise<
  | { error: string }
  | { data: ExportData; imageData?: ExportImageData["images"] }
> {
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Sem permissão" };

  // Fetch convenio info
  const { data: convenio } = await supabase
    .from("convenios")
    .select("company_name, cnpj")
    .eq("id", convenioId)
    .single();
  if (!convenio) return { error: "Convênio não encontrado" };

  // Fetch sales
  const { data: sales } = await supabase
    .from("sales")
    .select(
      `
      id, sale_date, total_value, is_installment, installment_count, status,
      store:stores(name),
      conveniado:conveniados(full_name, cpf),
      sale_images(id, storage_path, installment_number)
    `
    )
    .eq("convenio_id", convenioId)
    .gte("sale_date", dateFrom)
    .lte("sale_date", dateTo)
    .order("sale_date", { ascending: true });

  if (!sales || sales.length === 0) {
    return { error: "Nenhuma venda encontrada no período" };
  }

  const rows: ExportRow[] = sales.map((s) => {
    const store = Array.isArray(s.store) ? s.store[0] : s.store;
    const conveniado = Array.isArray(s.conveniado)
      ? s.conveniado[0]
      : s.conveniado;

    return {
      saleId: s.id,
      storeName: store?.name ?? "—",
      conveniadoName: conveniado?.full_name ?? "—",
      conveniadoCpf: conveniado ? maskCPFDisplay(conveniado.cpf) : "—",
      saleDate: format(new Date(s.sale_date + "T12:00:00"), "dd/MM/yyyy", {
        locale: datePtBR,
      }),
      totalValue: Number(s.total_value),
      installments: s.is_installment ? `${s.installment_count}x` : "À vista",
      status:
        s.status === "pending"
          ? "Pendente"
          : s.status === "exported"
          ? "Exportado"
          : "Fechado",
    };
  });

  const totalValue = rows.reduce((sum, r) => sum + r.totalValue, 0);

  const exportData: ExportData = {
    convenioName: convenio.company_name,
    convenioCnpj: convenio.cnpj ? formatCNPJ(convenio.cnpj) : "Não informado",
    dateFrom: format(new Date(dateFrom + "T12:00:00"), "dd/MM/yyyy", {
      locale: datePtBR,
    }),
    dateTo: format(new Date(dateTo + "T12:00:00"), "dd/MM/yyyy", {
      locale: datePtBR,
    }),
    rows,
    totalValue,
  };

  // For images export, generate signed URLs
  let imageData: ExportImageData["images"] | undefined;
  if (exportType === "images") {
    const allImages: ExportImageData["images"] = [];
    for (const s of sales) {
      const conveniado = Array.isArray(s.conveniado)
        ? s.conveniado[0]
        : s.conveniado;
      const imgs = Array.isArray(s.sale_images) ? s.sale_images : [];
      for (const img of imgs) {
        const { data: signedData } = await supabase.storage
          .from("requisitions")
          .createSignedUrl(img.storage_path, 3600);
        if (signedData?.signedUrl) {
          allImages.push({
            saleId: s.id,
            conveniadoName: conveniado?.full_name ?? "desconhecido",
            saleDate: s.sale_date,
            storagePath: img.storage_path,
            signedUrl: signedData.signedUrl,
            installmentNumber: img.installment_number,
          });
        }
      }
    }
    imageData = allImages;
  }

  // Update sales status to 'exported' (only pending ones)
  const pendingSaleIds = sales
    .filter((s) => s.status === "pending")
    .map((s) => s.id);

  if (pendingSaleIds.length > 0) {
    await supabase
      .from("sales")
      .update({ status: "exported" })
      .in("id", pendingSaleIds);
  }

  // Log export
  await supabase.from("export_logs").insert({
    exported_by: user.id,
    convenio_id: convenioId,
    date_from: dateFrom,
    date_to: dateTo,
    total_sales: sales.length,
    export_type: exportType,
  });

  revalidatePath("/admin/export");
  revalidatePath("/admin/dashboard");

  return { data: exportData, imageData };
}
