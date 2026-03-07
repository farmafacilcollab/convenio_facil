"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import type { Profile, Store } from "@/lib/types/app.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { resetUserPassword, toggleUserActive } from "./actions";
import { ptBR } from "@/lib/i18n/pt-BR";
import { toast } from "sonner";

type UserRow = Profile & {
  store: Pick<Store, "name"> | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [resetDialog, setResetDialog] = useState<{
    userId: string;
    email: string;
  } | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*, store:stores(name)")
      .order("role")
      .order("email");

    setUsers(
      (data ?? []).map((d) => ({
        ...d,
        store: Array.isArray(d.store) ? d.store[0] ?? null : d.store,
      }))
    );
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResetPassword = async () => {
    if (!resetDialog) return;
    const result = await resetUserPassword(resetDialog.userId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Senha redefinida para: ${result.password}`);
    }
    setResetDialog(null);
  };

  const handleToggleActive = async (
    userId: string,
    email: string,
    isBanned: boolean
  ) => {
    const result = await toggleUserActive(userId, email, !isBanned);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isBanned ? "Usuário ativado" : "Usuário desativado");
    fetchUsers();
  };

  return (
    <div className="animate-ios-fade-in space-y-6">
      <h2 className="text-[28px] font-bold tracking-tight">{ptBR.users}</h2>

      <div className="space-y-3">
        {users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {ptBR.noResults}
          </p>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="press-scale shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant={
                        user.role === "admin" ? "default" : "outline"
                      }
                    >
                      {user.role === "admin" ? ptBR.admin : ptBR.store}
                    </Badge>
                    {user.store && <span>{user.store.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setResetDialog({
                        userId: user.id,
                        email: user.email,
                      })
                    }
                  >
                    {ptBR.resetPassword}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reset Password Confirmation */}
      <AlertDialog
        open={!!resetDialog}
        onOpenChange={(o) => !o && setResetDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ptBR.resetPassword}</AlertDialogTitle>
            <AlertDialogDescription>
              Redefinir a senha de <strong>{resetDialog?.email}</strong>?
              A nova senha será gerada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ptBR.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              {ptBR.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
