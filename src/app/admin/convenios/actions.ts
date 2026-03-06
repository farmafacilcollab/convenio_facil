"use server";

import { createClient } from "@/lib/supabase/server";
import { convenioSchema } from "@/lib/validations/convenio.schema";
import { unmaskCNPJ } from "@/lib/utils/cnpj";
import { revalidatePath } from "next/cache";
import type { Convenio } from "@/lib/types/app.types";

export async function fetchConveniosAdmin(showInactive: boolean): Promise<Convenio[]> {
  const supabase = await createClient();
  let query = supabase
    .from("convenios")
    .select("*")
    .order("company_name", { ascending: true });

  if (!showInactive) {
    query = query.eq("active", true);
  }

  const { data } = await query;
  return data ?? [];
}

export async function createConvenio(formData: {
  company_name: string;
  cnpj: string;
}) {
  const supabase = await createClient();

  const parsed = convenioSchema.safeParse({
    ...formData,
    cnpj: unmaskCNPJ(formData.cnpj),
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("convenios").insert({
    company_name: parsed.data.company_name,
    cnpj: parsed.data.cnpj,
    active: true,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "CNPJ já cadastrado" };
    return { error: "Erro ao criar convênio" };
  }

  revalidatePath("/admin/convenios");
  return { success: true };
}

export async function updateConvenio(
  id: string,
  formData: { company_name: string; cnpj: string }
) {
  const supabase = await createClient();

  const parsed = convenioSchema.safeParse({
    ...formData,
    cnpj: unmaskCNPJ(formData.cnpj),
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("convenios")
    .update({
      company_name: parsed.data.company_name,
      cnpj: parsed.data.cnpj,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "CNPJ já cadastrado" };
    return { error: "Erro ao atualizar convênio" };
  }

  revalidatePath("/admin/convenios");
  return { success: true };
}

export async function toggleConvenioActive(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("convenios")
    .update({ active })
    .eq("id", id);

  if (error) return { error: "Erro ao alterar status" };

  revalidatePath("/admin/convenios");
  return { success: true };
}

export async function importConvenios(
  rows: { company_name: string; cnpj: string }[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado", imported: 0, errors: 0 };

  let imported = 0;
  let errors = 0;

  for (const row of rows) {
    const cnpj = (row.cnpj ?? "").replace(/\D/g, "");
    const { error } = await supabase.from("convenios").upsert(
      {
        company_name: row.company_name.trim(),
        cnpj,
        active: true,
        created_by: user.id,
      },
      { onConflict: "cnpj" }
    );

    if (error) errors++;
    else imported++;
  }

  revalidatePath("/admin/convenios");
  return { success: true, imported, errors };
}
