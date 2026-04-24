"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, setOrbs } = useUser();

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

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setRedeeming(true);

    const { data, error } = await supabase.rpc("redeem_code", { p_code: code.trim() });

    if (error) {
      const msg =
        error.message.includes("INVALID_CODE")
          ? "Invalid or already used code."
          : "Something went wrong. Please try again.";
      toast.error(msg);
    } else {
      const result = data as { orbs_reward: number; new_orbs: number };
      await setOrbs(result.new_orbs);
      toast.success(`+${result.orbs_reward} orbs added to your account!`);
      setCode("");
      setRedeemOpen(false);
    }

    setRedeeming(false);
  }

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/home/leaderboard", label: "Leaderboard" },
  ];

  const avatarLetter = profile.username.charAt(0).toUpperCase();
  const displayName = profile.username.replace(/[_\-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const displayEmail = user?.email ?? "—";
  const orbs = profile.orbs;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/8 bg-theme-dark-blue/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <Link href="/home" className="select-none text-xl font-bold tracking-widest text-blue-300 uppercase">
            Hexora
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Orbs + redeem button — always visible */}
            <div className="flex items-center">
              {/* + button */}
              <button
                onClick={() => setRedeemOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-l-full border border-r-0 border-blue-500/25 bg-blue-500/8 text-blue-300 transition hover:bg-blue-500/14"
                aria-label="Redeem orb code"
              >
                <Plus className="h-8.5 w-3.5" />
              </button>
              {/* Orbs count */}
              <div className="flex h-8 items-center gap-1.5 rounded-r-full border border-blue-500/25 bg-blue-500/8 px-3 text-sm font-semibold text-blue-300">
                <Image src="/orb.svg" alt="orbs" width={16} height={16} className="h-4 w-4" />
                {loading ? (
                  <Skeleton className="h-3.5 w-8 bg-blue-500/20" />
                ) : (
                  <span>{orbs}</span>
                )}
              </div>
            </div>

            {/* Nav links — desktop only */}
            <nav className="hidden items-center gap-1 md:flex">
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

            {/* Profile dropdown — desktop only */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="relative hidden h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-transparent transition hover:ring-blue-500/50 focus:outline-none md:flex"
                aria-label="Open profile menu"
              >
                {loading ? (
                  <Skeleton className="h-4 w-4 rounded-full bg-white/30" />
                ) : (
                  avatarLetter
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 border-white/10 bg-[#040c28] text-white"
              >
                <div className="px-2 py-1.5">
                  {loading ? (
                    <>
                      <Skeleton className="mb-1.5 h-4 w-28 bg-white/10" />
                      <Skeleton className="h-3 w-36 bg-white/8" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="mt-0.5 truncate text-xs text-white/45">{displayEmail}</p>
                    </>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="gap-2.5"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-white/10 bg-[#040c28] text-white"
              >
                {/* Profile info */}
                <div className="px-2 py-1.5">
                  {loading ? (
                    <>
                      <Skeleton className="mb-1.5 h-4 w-28 bg-white/10" />
                      <Skeleton className="h-3 w-36 bg-white/8" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="mt-0.5 truncate text-xs text-white/45">{displayEmail}</p>
                    </>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                {/* Nav links */}
                {navLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className={pathname === link.href ? "text-white" : "text-white/60"}
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="gap-2.5"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Redeem Dialog */}
      <Dialog open={redeemOpen} onOpenChange={(open) => { setRedeemOpen(open); if (!open) setCode(""); }}>
        <DialogContent className="border-white/10 bg-[#040c28] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Image src="/orb.svg" alt="orbs" width={16} height={16} className="h-4 w-4" />
              Redeem Orb Code
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Enter a valid code to add orbs to your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRedeem} className="space-y-4">
            <Input
              placeholder="e.g. HEXORA2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="border-white/20 bg-white/5 uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-white/30 focus-visible:ring-amber-400/40"
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRedeemOpen(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={redeeming || !code.trim()}
                className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
              >
                {redeeming ? "Redeeming…" : "Redeem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
