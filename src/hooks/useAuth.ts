"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let cancelled = false;

    const clearState = () => {
      if (!cancelled) {
        setState({
          user: null,
          profile: null,
          role: null,
          storeId: null,
          isLoading: false,
        });
      }
    };

    const loadProfile = async (userId: string): Promise<Profile | null> => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return data as Profile | null;
    };

    const setAuthenticated = (user: User, profile: Profile | null) => {
      if (!cancelled) {
        setState({
          user,
          profile,
          role: profile?.role ?? null,
          storeId: profile?.store_id ?? null,
          isLoading: false,
        });
      }
    };

    const getSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = await loadProfile(user.id);
          setAuthenticated(user, profile);
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
          const profile = await loadProfile(session.user.id);
          setAuthenticated(session.user, profile);
        } else {
          clearState();
        }
      } catch {
        clearState();
      }
    });

    // Timeout de segurança: se não resolver em 10s, liberar o loading
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev.isLoading) return { ...prev, isLoading: false };
        return prev;
      });
    }, 10000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Forçar navegação mesmo se signOut falhar
    }
  }, [supabase]);

  return { ...state, signOut };
}
