import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { RoleName, TableRow } from "@/types/database";

type Profile = TableRow<"profiles"> & { roles?: TableRow<"roles"> | null };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: RoleName | null;
  isAdmin: boolean;
  isClient: boolean;
  clientId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<"/app" | "/client">;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*, roles(*)").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

async function loadClientId(userId: string): Promise<string | null> {
  const { data } = await supabase.from("clients").select("id").eq("auth_user_id", userId).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

function isAdminProfile(profile: Profile | null) {
  const role = profile?.roles?.name ?? null;
  const adminRoles: RoleName[] = ["Super Admin", "Sales Manager", "Sales Executive", "Accountant", "Project Manager", "Staff", "Support Executive"];
  return role !== null && adminRoles.includes(role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const [p, cId] = await Promise.all([
          loadProfile(data.session.user.id),
          loadClientId(data.session.user.id),
        ]);
        setProfile(p);
        setClientId(cId);
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        (async () => {
          const [p, cId] = await Promise.all([
            loadProfile(nextSession.user.id),
            loadClientId(nextSession.user.id),
          ]);
          setProfile(p);
          setClientId(cId);
        })();
      } else {
        setProfile(null);
        setClientId(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.roles?.name ?? null;
    const adminRoles: RoleName[] = ["Super Admin", "Sales Manager", "Sales Executive", "Accountant", "Project Manager", "Staff", "Support Executive"];
    const isAdmin = clientId === null && role !== null && adminRoles.includes(role);
    const isClient = clientId !== null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      role,
      isAdmin,
      isClient,
      clientId,
      loading,
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session?.user) return "/app";

        const [nextProfile, nextClientId] = await Promise.all([
          loadProfile(data.session.user.id),
          loadClientId(data.session.user.id),
        ]);

        setSession(data.session);
        setProfile(nextProfile);
        setClientId(nextClientId);

        if (nextClientId) return "/client";
        if (isAdminProfile(nextProfile)) return "/app";
        return "/app";
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
    };
  }, [loading, profile, session, clientId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
