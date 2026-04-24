"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  orbs: number;
  pts: number;
}

interface UserContextValue {
  profile: UserProfile;
  loading: boolean;
  setOrbs: (orbs: number | ((prev: number) => number)) => void;
  setPts: (pts: number | ((prev: number) => number)) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const DEFAULT_PROFILE: UserProfile = {
  id: "",
  username: "Player",
  email: "",
  orbs: 200,
  pts: 0,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId: string, email: string) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, orbs, pts")
        .eq("id", userId)
        .single();

      if (mounted && data) {
        setProfile({
          id: data.id,
          username: data.username,
          email,
          orbs: data.orbs,
          pts: data.pts,
        });
      }
      if (mounted) setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        if (mounted) setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        if (mounted) {
          setProfile(DEFAULT_PROFILE);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  function setOrbs(value: number | ((prev: number) => number)) {
    setProfile((p) => {
      const next = typeof value === "function" ? value(p.orbs) : value;
      // Persist to DB (fire-and-forget)
      if (p.id) supabase.from("profiles").update({ orbs: next }).eq("id", p.id);
      return { ...p, orbs: next };
    });
  }

  function setPts(value: number | ((prev: number) => number)) {
    setProfile((p) => {
      const next = typeof value === "function" ? value(p.pts) : value;
      if (p.id) supabase.from("profiles").update({ pts: next }).eq("id", p.id);
      return { ...p, pts: next };
    });
  }

  return (
    <UserContext.Provider value={{ profile, loading, setOrbs, setPts }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
