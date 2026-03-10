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
  cpf?: string;
  cnpj?: string;
  convenio_id: string;
}) {
  const supabase = await createClient();

  const cpf = formData.cpf?.replace(/\D/g, "") || "";
  const cnpj = formData.cnpj?.replace(/\D/g, "") || "";

  const parsed = conveniadoSchema.safeParse({
    full_name: formData.full_name,
    cpf: cpf,
    cnpj: cnpj,
    convenio_id: formData.convenio_id,
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const insertData: Record<string, unknown> = {
    full_name: parsed.data.full_name,
    convenio_id: parsed.data.convenio_id,
    active: true,
    created_by: user.id,
  };

  if (cpf) insertData.cpf = cpf;
  if (cnpj) insertData.cnpj = cnpj;

  const { error } = await supabase.from("conveniados").insert(insertData);

  if (error) {
    if (error.code === "23505") return { error: "CPF ou CNPJ já cadastrado" };
    return { error: "Erro ao criar conveniado" };
  }

  revalidatePath("/admin/conveniados");
  return { success: true };
}

export async function updateConveniado(
  id: string,
  formData: { full_name: string; cpf?: string; cnpj?: string; convenio_id: string }
) {
  const supabase = await createClient();

  const cpf = formData.cpf?.replace(/\D/g, "") || "";
  const cnpj = formData.cnpj?.replace(/\D/g, "") || "";

  const parsed = conveniadoSchema.safeParse({
    full_name: formData.full_name,
    cpf: cpf,
    cnpj: cnpj,
    convenio_id: formData.convenio_id,
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updateData: Record<string, unknown> = {
    full_name: parsed.data.full_name,
    convenio_id: parsed.data.convenio_id,
  };

  if (cpf) {
    updateData.cpf = cpf;
    updateData.cnpj = null;
  } else if (cnpj) {
    updateData.cnpj = cnpj;
    updateData.cpf = null;
  }

  const { error } = await supabase
    .from("conveniados")
    .update(updateData)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "CPF ou CNPJ já cadastrado" };
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
  rows: { full_name: string; cpf?: string; cnpj?: string; convenio_id: string }[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado", imported: 0, errors: 0 };

  let imported = 0;
  let errors = 0;

  for (const row of rows) {
    const cpf = row.cpf?.replace(/\D/g, "") || "";
    const cnpj = row.cnpj?.replace(/\D/g, "") || "";

    const parsed = conveniadoSchema.safeParse({
      full_name: row.full_name.trim(),
      cpf,
      cnpj,
      convenio_id: row.convenio_id,
      active: true,
    });
    if (!parsed.success) {
      errors++;
      continue;
    }

    const upsertData: Record<string, unknown> = {
      full_name: parsed.data.full_name,
      convenio_id: parsed.data.convenio_id,
      active: true,
      created_by: user.id,
    };

    if (cpf) upsertData.cpf = cpf;
    if (cnpj) upsertData.cnpj = cnpj;

    const onConflict = cpf ? "cpf" : "cnpj";

    const { error } = await supabase.from("conveniados").upsert(upsertData, {
      onConflict,
    });

    if (error) errors++;
    else imported++;
  }

  revalidatePath("/admin/conveniados");
  return { success: true, imported, errors };
}

// ============================================
// XLSX Import — Sincronização por convênio
// ============================================

type SyncRow = { full_name: string; cpf?: string; cnpj?: string };

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

  // Mapear documentos recebidos (CPF ou CNPJ)
  const docMap = new Map<string, { full_name: string; type: "cpf" | "cnpj" }>(); // doc -> { full_name, type }
  const ignored: string[] = [];

  for (const row of rows) {
    const cpf = row.cpf?.replace(/\D/g, "") || "";
    const cnpj = row.cnpj?.replace(/\D/g, "") || "";

    if (!cpf && !cnpj) {
      ignored.push(`Linha sem CPF ou CNPJ: ${row.full_name}`);
      continue;
    }

    if (cpf && cnpj) {
      ignored.push(`Linha com CPF e CNPJ simultâneos: ${row.full_name}`);
      continue;
    }

    const doc = cpf || cnpj;
    const type = cpf ? ("cpf" as const) : ("cnpj" as const);

    if (docMap.has(doc)) {
      ignored.push(`${type.toUpperCase()} ${doc} duplicado na planilha`);
      continue;
    }
    docMap.set(doc, { full_name: row.full_name.trim(), type });
  }

  const docsRecebidos = new Set(docMap.keys());

  // Se convênio já existe, buscar conveniados atuais
  let existingMap = new Map<string, { id: string; cpf?: string; cnpj?: string; full_name: string; active: boolean }>();
  if (convenioId) {
    const { data: existing } = await supabase
      .from("conveniados")
      .select("id, cpf, cnpj, full_name, active")
      .eq("convenio_id", convenioId);

    for (const c of existing ?? []) {
      if (c.cpf) existingMap.set(c.cpf, { id: c.id, cpf: c.cpf, full_name: c.full_name, active: c.active });
      if (c.cnpj) existingMap.set(c.cnpj, { id: c.id, cnpj: c.cnpj, full_name: c.full_name, active: c.active });
    }
  }

  // Verificar documentos que existem em OUTROS convênios
  if (docsRecebidos.size > 0) {
    const docArray = Array.from(docsRecebidos);
    const otherConveniados = await batchSelectIn<{ cpf?: string; cnpj?: string; convenio_id: string }>(
      supabase, "conveniados", "cpf, cnpj, convenio_id", "cpf", docArray,
    );

    for (const c of otherConveniados) {
      if (convenioId && c.convenio_id === convenioId) continue;
      const doc = c.cpf || c.cnpj;
      if (doc && docsRecebidos.has(doc) && !existingMap.has(doc)) {
        ignored.push(`${c.cpf ? "CPF" : "CNPJ"} ${doc} já vinculado a outro convênio`);
        docsRecebidos.delete(doc);
        docMap.delete(doc);
      }
    }
  }

  const docsExistentes = new Set(existingMap.keys());

  // Calcular diff
  let toAdd = 0;
  let toUpdate = 0;
  let toReactivate = 0;
  let toDeactivate = 0;

  for (const doc of docsRecebidos) {
    const existing = existingMap.get(doc);
    if (!existing) {
      toAdd++;
    } else {
      if (!existing.active) toReactivate++;
      const newInfo = docMap.get(doc)!;
      if (existing.full_name !== newInfo.full_name) toUpdate++;
    }
  }

  for (const doc of docsExistentes) {
    if (!docsRecebidos.has(doc)) {
      const existing = existingMap.get(doc)!;
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

  // Mapear documentos recebidos (deduplicar)
  const docMap = new Map<string, { full_name: string; type: "cpf" | "cnpj" }>();
  const ignored: string[] = [];

  for (const row of rows) {
    const cpf = row.cpf?.replace(/\D/g, "") || "";
    const cnpj = row.cnpj?.replace(/\D/g, "") || "";

    if (!cpf && !cnpj) {
      ignored.push(`Linha sem CPF ou CNPJ: ${row.full_name}`);
      continue;
    }

    if (cpf && cnpj) {
      ignored.push(`Linha com CPF e CNPJ simultâneos: ${row.full_name}`);
      continue;
    }

    const doc = cpf || cnpj;
    const type = cpf ? ("cpf" as const) : ("cnpj" as const);

    if (docMap.has(doc)) {
      ignored.push(`${type.toUpperCase()} ${doc} duplicado na planilha`);
      continue;
    }
    docMap.set(doc, { full_name: row.full_name.trim(), type });
  }

  const docsRecebidos = new Set(docMap.keys());

  // Verificar documentos em outros convênios
  if (docsRecebidos.size > 0) {
    const otherConveniados = await batchSelectIn<{ cpf?: string; cnpj?: string; convenio_id: string }>(
      supabase, "conveniados", "cpf, cnpj, convenio_id", "cpf", Array.from(docsRecebidos),
    );

    for (const c of otherConveniados) {
      const doc = c.cpf || c.cnpj;
      if (doc && c.convenio_id !== convenioId && docsRecebidos.has(doc)) {
        ignored.push(`${c.cpf ? "CPF" : "CNPJ"} ${doc} já vinculado a outro convênio`);
        docsRecebidos.delete(doc);
        docMap.delete(doc);
      }
    }
  }

  // Buscar conveniados existentes do convênio
  const { data: existing } = await supabase
    .from("conveniados")
    .select("id, cpf, cnpj, full_name, active")
    .eq("convenio_id", convenioId);

  const existingMap = new Map<string, { id: string; cpf?: string; cnpj?: string; full_name: string; active: boolean }>();
  for (const c of existing ?? []) {
    if (c.cpf) existingMap.set(c.cpf, { id: c.id, cpf: c.cpf, full_name: c.full_name, active: c.active });
    if (c.cnpj) existingMap.set(c.cnpj, { id: c.id, cnpj: c.cnpj, full_name: c.full_name, active: c.active });
  }

  let added = 0;
  let updated = 0;
  let reactivated = 0;
  let deactivated = 0;

  // ADICIONAR + ATUALIZAR + REATIVAR
  for (const [doc, docInfo] of docMap) {
    if (!docsRecebidos.has(doc)) continue; // foi removido por conflito

    const ex = existingMap.get(doc);
    if (!ex) {
      // INSERT novo conveniado
      const insertData: Record<string, unknown> = {
        full_name: docInfo.full_name,
        convenio_id: convenioId,
        active: true,
        created_by: user.id,
      };
      if (docInfo.type === "cpf") {
        insertData.cpf = doc;
      } else {
        insertData.cnpj = doc;
      }

      const { error } = await supabase.from("conveniados").insert(insertData);
      if (!error) added++;
      else ignored.push(`Erro ao inserir ${docInfo.type.toUpperCase()} ${doc}: ${error?.message}`);
    } else {
      const updates: Record<string, unknown> = {};
      if (ex.full_name !== docInfo.full_name) updates.full_name = docInfo.full_name;
      if (!ex.active) updates.active = true;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("conveniados")
          .update(updates)
          .eq("id", ex.id);
        if (!error) {
          if (!ex.active) reactivated++;
          if (ex.full_name !== docInfo.full_name) updated++;
        }
      }
    }
  }

  // DESATIVAR — conveniados que não estão mais na planilha
  for (const [doc, ex] of existingMap) {
    if (!docsRecebidos.has(doc) && ex.active) {
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
