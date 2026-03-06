"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types/app.types";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  storeId: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    storeId: null,
    isLoading: true,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return data as Profile | null;
    },
    [supabase]
  );

  useEffect(() => {
    const clearState = () =>
      setState({
        user: null,
        profile: null,
        role: null,
        storeId: null,
        isLoading: false,
      });

    const getSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = await fetchProfile(user.id);
          setState({
            user,
            profile,
            role: profile?.role ?? null,
            storeId: profile?.store_id ?? null,
            isLoading: false,
          });
        } else {
          clearState();
        }
      } catch {
        clearState();
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            role: profile?.role ?? null,
            storeId: profile?.store_id ?? null,
            isLoading: false,
          });
        } else {
          clearState();
        }
      } catch {
        clearState();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Forçar limpeza local mesmo se signOut falhar
    }
  }, [supabase]);

  return { ...state, signOut };
}
