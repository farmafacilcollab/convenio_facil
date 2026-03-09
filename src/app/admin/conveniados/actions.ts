"use server";

import { createClient } from "@/lib/supabase/server";
import { conveniadoSchema } from "@/lib/validations/conveniado.schema";
import { revalidatePath } from "next/cache";
import type { Conveniado, Convenio } from "@/lib/types/app.types";

export async function fetchConveniadosAdmin(opts: {
  showInactive: boolean;
  filterConvenio: string;
}): Promise<(Conveniado & { convenio: Pick<Convenio, "company_name"> | null })[]> {
  const supabase = await createClient();
  let query = supabase
    .from("conveniados")
    .select("*, convenio:convenios(company_name)")
    .order("full_name", { ascending: true });

  if (!opts.showInactive) {
    query = query.eq("active", true);
  }
  if (opts.filterConvenio !== "all") {
    query = query.eq("convenio_id", opts.filterConvenio);
  }

  const { data } = await query;
  return (data ?? []).map((d) => ({
    ...d,
    convenio: Array.isArray(d.convenio) ? d.convenio[0] ?? null : d.convenio,
  }));
}

export async function fetchConveniosList(): Promise<Pick<Convenio, "id" | "company_name">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("convenios")
    .select("id, company_name")
    .eq("active", true)
    .order("company_name");
  return data ?? [];
}

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

    const parsed = conveniadoSchema.safeParse({
      full_name: row.full_name.trim(),
      cpf,
      convenio_id: row.convenio_id,
      active: true,
    });
    if (!parsed.success) {
      errors++;
      continue;
    }

    const { error } = await supabase.from("conveniados").upsert(
      {
        full_name: parsed.data.full_name,
        cpf: parsed.data.cpf,
        convenio_id: parsed.data.convenio_id,
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

// ============================================
// XLSX Import — Sincronização por convênio
// ============================================

type SyncRow = { full_name: string; cpf: string };

const BATCH_SIZE = 300;

async function batchSelectIn<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  columns: string,
  filterCol: string,
  values: string[],
  extraFilter?: { col: string; val: string },
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const chunk = values.slice(i, i + BATCH_SIZE);
    let query = supabase.from(table).select(columns).in(filterCol, chunk);
    if (extraFilter) query = query.eq(extraFilter.col, extraFilter.val);
    const { data } = await query;
    if (data) results.push(...(data as T[]));
  }
  return results;
}

function normalizeConvenioName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export type PreviewSyncResult =
  | { error: string }
  | {
      convenioId: string | null;
      convenioName: string;
      convenioFound: boolean;
      toAdd: number;
      toUpdate: number;
      toReactivate: number;
      toDeactivate: number;
      totalActive: number;
      ignored: string[];
    };

export async function previewSyncConveniados(
  rows: SyncRow[],
  convenioName: string
): Promise<PreviewSyncResult> {
  try {
  const supabase = await createClient();

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

  // Detectar convênio por nome normalizado
  const normalized = normalizeConvenioName(convenioName);
  const { data: allConvenios } = await supabase
    .from("convenios")
    .select("id, company_name");

  const matched = (allConvenios ?? []).filter(
    (c) => normalizeConvenioName(c.company_name) === normalized
  );

  if (matched.length > 1) {
    return { error: "Múltiplos convênios encontrados com o mesmo nome. Corrija no cadastro de convênios." };
  }

  const convenioFound = matched.length === 1;
  const convenioId = convenioFound ? matched[0].id : null;

  // Mapear CPFs recebidos
  const cpfMap = new Map<string, string>(); // cpf -> full_name
  const ignored: string[] = [];

  for (const row of rows) {
    const cpf = row.cpf.replace(/\D/g, "");
    if (cpfMap.has(cpf)) {
      ignored.push(`CPF ${cpf} duplicado na planilha`);
      continue;
    }
    cpfMap.set(cpf, row.full_name.trim());
  }

  const cpfsRecebidos = new Set(cpfMap.keys());

  // Se convênio já existe, buscar conveniados atuais
  let existingMap = new Map<string, { id: string; full_name: string; active: boolean }>();
  if (convenioId) {
    const { data: existing } = await supabase
      .from("conveniados")
      .select("id, cpf, full_name, active")
      .eq("convenio_id", convenioId);

    for (const c of existing ?? []) {
      existingMap.set(c.cpf, { id: c.id, full_name: c.full_name, active: c.active });
    }
  }

  // Verificar CPFs que existem em OUTROS convênios
  if (cpfsRecebidos.size > 0) {
    const cpfArray = Array.from(cpfsRecebidos);
    const otherConveniados = await batchSelectIn<{ cpf: string; convenio_id: string }>(
      supabase, "conveniados", "cpf, convenio_id", "cpf", cpfArray,
    );

    for (const c of otherConveniados) {
      if (convenioId && c.convenio_id === convenioId) continue;
      if (!convenioId || c.convenio_id !== convenioId) {
        if (cpfsRecebidos.has(c.cpf) && !existingMap.has(c.cpf)) {
          ignored.push(`CPF ${c.cpf} já vinculado a outro convênio`);
          cpfsRecebidos.delete(c.cpf);
          cpfMap.delete(c.cpf);
        }
      }
    }
  }

  const cpfsExistentes = new Set(existingMap.keys());

  // Calcular diff
  let toAdd = 0;
  let toUpdate = 0;
  let toReactivate = 0;
  let toDeactivate = 0;

  for (const cpf of cpfsRecebidos) {
    const existing = existingMap.get(cpf);
    if (!existing) {
      toAdd++;
    } else {
      if (!existing.active) toReactivate++;
      const newName = cpfMap.get(cpf)!;
      if (existing.full_name !== newName) toUpdate++;
    }
  }

  for (const cpf of cpfsExistentes) {
    if (!cpfsRecebidos.has(cpf)) {
      const existing = existingMap.get(cpf)!;
      if (existing.active) toDeactivate++;
    }
  }

  const totalActive = Array.from(existingMap.values()).filter((c) => c.active).length;

  return {
    convenioId,
    convenioName: convenioFound ? matched[0].company_name : convenioName.trim(),
    convenioFound,
    toAdd,
    toUpdate,
    toReactivate,
    toDeactivate,
    totalActive,
    ignored,
  };
  } catch (err) {
    console.error("previewSyncConveniados error:", err);
    return { error: "Erro ao processar preview. Tente novamente." };
  }
}

export type ExecuteSyncResult =
  | { error: string }
  | {
      success: true;
      convenioId: string;
      added: number;
      updated: number;
      reactivated: number;
      deactivated: number;
      ignored: string[];
    };

export async function executeSyncConveniados(
  rows: SyncRow[],
  convenioName: string
): Promise<ExecuteSyncResult> {
  try {
  const supabase = await createClient();

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

  // Detectar ou criar convênio
  const normalized = normalizeConvenioName(convenioName);
  const { data: allConvenios } = await supabase
    .from("convenios")
    .select("id, company_name");

  const matched = (allConvenios ?? []).filter(
    (c) => normalizeConvenioName(c.company_name) === normalized
  );

  if (matched.length > 1) {
    return { error: "Múltiplos convênios encontrados com o mesmo nome." };
  }

  let convenioId: string;
  if (matched.length === 1) {
    convenioId = matched[0].id;
  } else {
    const { data: newConvenio, error: insertErr } = await supabase
      .from("convenios")
      .insert({
        company_name: convenioName.trim().toUpperCase(),
        active: true,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (insertErr || !newConvenio) {
      return { error: "Erro ao criar convênio automaticamente." };
    }
    convenioId = newConvenio.id;
  }

  // Mapear CPFs recebidos (deduplicar)
  const cpfMap = new Map<string, string>();
  const ignored: string[] = [];

  for (const row of rows) {
    const cpf = row.cpf.replace(/\D/g, "");
    if (cpfMap.has(cpf)) {
      ignored.push(`CPF ${cpf} duplicado na planilha`);
      continue;
    }
    cpfMap.set(cpf, row.full_name.trim());
  }

  const cpfsRecebidos = new Set(cpfMap.keys());

  // Verificar CPFs em outros convênios
  if (cpfsRecebidos.size > 0) {
    const otherConveniados = await batchSelectIn<{ cpf: string; convenio_id: string }>(
      supabase, "conveniados", "cpf, convenio_id", "cpf", Array.from(cpfsRecebidos),
    );

    for (const c of otherConveniados) {
      if (c.convenio_id !== convenioId && cpfsRecebidos.has(c.cpf)) {
        ignored.push(`CPF ${c.cpf} já vinculado a outro convênio`);
        cpfsRecebidos.delete(c.cpf);
        cpfMap.delete(c.cpf);
      }
    }
  }

  // Buscar conveniados existentes do convênio
  const { data: existing } = await supabase
    .from("conveniados")
    .select("id, cpf, full_name, active")
    .eq("convenio_id", convenioId);

  const existingMap = new Map<string, { id: string; full_name: string; active: boolean }>();
  for (const c of existing ?? []) {
    existingMap.set(c.cpf, { id: c.id, full_name: c.full_name, active: c.active });
  }

  let added = 0;
  let updated = 0;
  let reactivated = 0;
  let deactivated = 0;

  // ADICIONAR + ATUALIZAR + REATIVAR
  for (const [cpf, fullName] of cpfMap) {
    if (!cpfsRecebidos.has(cpf)) continue; // foi removido por conflito

    const ex = existingMap.get(cpf);
    if (!ex) {
      // INSERT novo conveniado
      const { error } = await supabase.from("conveniados").insert({
        full_name: fullName,
        cpf,
        convenio_id: convenioId,
        active: true,
        created_by: user.id,
      });
      if (!error) added++;
      else ignored.push(`Erro ao inserir CPF ${cpf}: ${error.message}`);
    } else {
      const updates: Record<string, unknown> = {};
      if (ex.full_name !== fullName) updates.full_name = fullName;
      if (!ex.active) updates.active = true;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("conveniados")
          .update(updates)
          .eq("id", ex.id);
        if (!error) {
          if (!ex.active) reactivated++;
          if (ex.full_name !== fullName) updated++;
        }
      }
    }
  }

  // DESATIVAR — conveniados que não estão mais na planilha
  for (const [cpf, ex] of existingMap) {
    if (!cpfsRecebidos.has(cpf) && ex.active) {
      const { error } = await supabase
        .from("conveniados")
        .update({ active: false })
        .eq("id", ex.id);
      if (!error) deactivated++;
    }
  }

  revalidatePath("/admin/conveniados");
  return { success: true, convenioId, added, updated, reactivated, deactivated, ignored };
  } catch (err) {
    console.error("executeSyncConveniados error:", err);
    return { error: "Erro ao sincronizar conveniados. Tente novamente." };
  }
}
