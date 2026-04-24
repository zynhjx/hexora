"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gem, LogOut, User } from "lucide-react";
import { supabase } from "@/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useUser } from "@/context/user-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useUser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/home/leaderboard", label: "Leaderboard" },
  ];

  const avatarLetter = loading ? "…" : profile.username.charAt(0).toUpperCase();
  const displayName = loading
    ? ""
    : profile.username.replace(/[_\-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const displayEmail = user?.email ?? "—";
  const orbs = profile.orbs;

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-theme-dark-blue/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">

        {/* Logo placeholder */}
        <Link href="/home" className="flex items-center gap-2.5 select-none">
          <svg
            viewBox="0 0 36 36"
            className="h-9 w-9 shrink-0"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="18,2 33,10 33,26 18,34 3,26 3,10"
              fill="#2563eb"
            />
            <text
              x="18"
              y="23"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              H
            </text>
          </svg>
          <span className="text-base font-semibold tracking-wide text-white">
            Hexora
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-5">

          {/* Orbs currency */}
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-400">
            <Gem className="h-4 w-4" />
            <span>{orbs}</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition-all ${
                    isActive
                      ? "text-white after:bg-blue-500"
                      : "text-white/50 after:bg-transparent hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-transparent transition hover:ring-blue-500/50 focus:outline-none"
              aria-label="Open profile menu"
            >
              {avatarLetter}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border-white/10 bg-[#040c28] text-white"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-white">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/45">
                  {displayEmail}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="gap-2.5 text-red-400/80 focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
