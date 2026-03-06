"use server";

import { createClient } from "@/lib/supabase/server";
import { conveniadoSchema } from "@/lib/validations/conveniado.schema";
import { revalidatePath } from "next/cache";

export async function createConveniado(formData: {
  full_name: string;
  cpf: string;
  convenio_id: string;
}) {
  const supabase = await createClient();

  const parsed = conveniadoSchema.safeParse({
    ...formData,
    cpf: formData.cpf.replace(/\D/g, ""),
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("conveniados").insert({
    full_name: parsed.data.full_name,
    cpf: parsed.data.cpf,
    convenio_id: parsed.data.convenio_id,
    active: true,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "CPF já cadastrado" };
    return { error: "Erro ao criar conveniado" };
  }

  revalidatePath("/admin/conveniados");
  return { success: true };
}

export async function updateConveniado(
  id: string,
  formData: { full_name: string; cpf: string; convenio_id: string }
) {
  const supabase = await createClient();

  const parsed = conveniadoSchema.safeParse({
    ...formData,
    cpf: formData.cpf.replace(/\D/g, ""),
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("conveniados")
    .update({
      full_name: parsed.data.full_name,
      cpf: parsed.data.cpf,
      convenio_id: parsed.data.convenio_id,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "CPF já cadastrado" };
    return { error: "Erro ao atualizar conveniado" };
  }

  revalidatePath("/admin/conveniados");
  return { success: true };
}

export async function toggleConveniadoActive(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conveniados")
    .update({ active })
    .eq("id", id);

  if (error) return { error: "Erro ao alterar status" };

  revalidatePath("/admin/conveniados");
  return { success: true };
}

export async function importConveniados(
  rows: { full_name: string; cpf: string; convenio_id: string }[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado", imported: 0, errors: 0 };

  let imported = 0;
  let errors = 0;

  for (const row of rows) {
    const cpf = row.cpf.replace(/\D/g, "");
    const { error } = await supabase.from("conveniados").upsert(
      {
        full_name: row.full_name.trim(),
        cpf,
        convenio_id: row.convenio_id,
        active: true,
        created_by: user.id,
      },
      { onConflict: "cpf" }
    );

    if (error) errors++;
    else imported++;
  }

  revalidatePath("/admin/conveniados");
  return { success: true, imported, errors };
}
