"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import("@supabase/supabase-js").Session | null } }) => {
      if (!session) {
        router.replace("/auth");
      } else {
        setChecking(false);
      }
    });

    // Also redirect if the session is revoked or expires mid-use
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: import("@supabase/supabase-js").AuthChangeEvent, session: import("@supabase/supabase-js").Session | null) => {
      if (!session) {
        router.replace("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (checking) return null;
  return <>{children}</>;
}
