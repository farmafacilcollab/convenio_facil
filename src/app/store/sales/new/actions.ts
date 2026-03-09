"use server";

import { createClient } from "@/lib/supabase/server";

interface SubmitSaleInput {
  store_id: string;
  convenio_id: string;
  conveniado_id: string;
  requisition_number: string;
  sale_date: string;
  total_value: number;
  is_installment: boolean;
  installment_count: number | null;
  created_by: string;
}

export async function submitSale(formData: FormData): Promise<{ saleId?: string; error?: string }> {
  try {
    const raw = formData.get("data") as string | null;
    if (!raw) return { error: "Dados da venda não enviados." };

    const input: SubmitSaleInput = JSON.parse(raw);
    const supabase = await createClient();

    // 1. Get store slug
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("slug")
      .eq("id", input.store_id)
      .single();

    if (storeErr || !store) {
      return { error: "Loja não encontrada." };
    }

    // 2. Create sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        store_id: input.store_id,
        convenio_id: input.convenio_id,
        conveniado_id: input.conveniado_id,
        requisition_number: input.requisition_number,
        sale_date: input.sale_date,
        total_value: input.total_value,
        is_installment: input.is_installment,
        installment_count: input.installment_count,
        created_by: input.created_by,
      })
      .select("id")
      .single();

    if (saleError || !sale) {
      return { error: saleError?.message ?? "Erro ao criar venda." };
    }

    // 3. Upload images (sent as file_0, file_1, ...)
    let i = 0;
    while (true) {
      const file = formData.get(`file_${i}`) as File | null;
      if (!file || file.size === 0) break;

      const installmentNum = formData.get(`installment_${i}`) as string | null;
      const installment = installmentNum ? parseInt(installmentNum, 10) : null;
      const suffix = installment !== null ? `req_${installment}` : "req_single";
      const path = `${store.slug}/${sale.id}/${suffix}.webp`;

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("requisitions")
        .upload(path, buffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        return { error: `Erro no upload da imagem ${i + 1}: ${uploadError.message}` };
      }

      const { error: imgError } = await supabase.from("sale_images").insert({
        sale_id: sale.id,
        installment_number: installment,
        storage_path: path,
        file_size_kb: Math.round(file.size / 1024),
      });

      if (imgError) {
        return { error: `Erro ao salvar imagem ${i + 1}: ${imgError.message}` };
      }

      i++;
    }

    return { saleId: sale.id };
  } catch (err) {
    console.error("submitSale server error:", err);
    return { error: "Erro inesperado no servidor." };
  }
}
