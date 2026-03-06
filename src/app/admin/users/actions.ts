"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resetUserPassword(userId: string) {
  const supabase = await createClient();

  // Verify caller is admin
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

  const admin = createAdminClient();
  const newPassword = `FarmaFacil@${new Date().getFullYear()}`;

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { error: "Erro ao redefinir senha" };

  revalidatePath("/admin/users");
  return { success: true, password: newPassword };
}

export async function toggleUserActive(
  userId: string,
  currentEmail: string,
  ban: boolean
) {
  const supabase = await createClient();

  // Verify caller is admin
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

  const admin = createAdminClient();

  if (ban) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ~100 years
    });
    if (error) return { error: "Erro ao desativar usuário" };
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
    if (error) return { error: "Erro ao ativar usuário" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
