"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Leaf, Shuffle, Zap } from "lucide-react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@/context/user-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type Difficulty = "easy" | "intermediate" | "advanced";

export const DIFFICULTY_KEY  = "hexora:hw:difficulty";
export const HW_PAID_KEY     = "hexora:paid:/home/games/hexo-words";

interface DifficultyOption {
  id: Difficulty;
  label: string;
  description: string;
  icon: ElementType;
  timer: string;
  pts: string;
  hint: string;
  orbCost: number;
  accent: string;
  iconBg: string;
  border: string;
  hoverBorder: string;
  statsBg: string;
}

const options: DifficultyOption[] = [
  {
    id: "easy",
    label: "Easy",
    description: "A relaxed pace to get familiar with cybersecurity terms. Scrambled letters and a helpful hint are always visible.",
    icon: Leaf,
    timer: "120s",
    pts: "+10 pts",
    hint: "Hint shown",
    orbCost: 10,
    accent: "text-emerald-400",
    iconBg: "bg-emerald-500/15 ring-emerald-500/30 group-hover:bg-emerald-500/25 group-hover:ring-emerald-400/50",
    border: "border-emerald-400/60 bg-emerald-500/12",
    hoverBorder: "hover:border-emerald-400/80 hover:bg-emerald-500/18",
    statsBg: "border-emerald-400/60 bg-emerald-500/10",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "The standard challenge. You have less time, but hints are still available to guide your answers.",
    icon: Zap,
    timer: "90s",
    pts: "+15 pts",
    hint: "Hint shown",
    orbCost: 15,
    accent: "text-blue-400",
    iconBg: "bg-blue-500/15 ring-blue-500/30 group-hover:bg-blue-500/25 group-hover:ring-blue-400/50",
    border: "border-blue-400/60 bg-blue-500/12",
    hoverBorder: "hover:border-blue-400/80 hover:bg-blue-500/18",
    statsBg: "border-blue-400/60 bg-blue-500/10",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "No hints — just scrambled letters and your knowledge. The clock is against you. Prove you know your stuff.",
    icon: Flame,
    timer: "60s",
    pts: "+40 pts",
    hint: "No hint",
    orbCost: 20,
    accent: "text-orange-400",
    iconBg: "bg-orange-500/15 ring-orange-500/30 group-hover:bg-orange-500/25 group-hover:ring-orange-400/50",
    border: "border-orange-400/60 bg-orange-500/12",
    hoverBorder: "hover:border-orange-400/80 hover:bg-orange-500/18",
    statsBg: "border-orange-400/60 bg-orange-500/10",
  },
];

export default function DifficultyPage() {
  const router = useRouter();
  const { profile, setOrbs } = useUser();
  const [selected, setSelected] = useState<DifficultyOption | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [paidDifficulty, setPaidDifficulty] = useState<string | null>(null);

  useEffect(() => {
    const paid = sessionStorage.getItem(HW_PAID_KEY) === "1";
    if (paid) {
      setPaidDifficulty(sessionStorage.getItem(DIFFICULTY_KEY));
    }
  }, []);

  function handleCardClick(opt: DifficultyOption) {
    const paid = sessionStorage.getItem(HW_PAID_KEY) === "1";
    const storedDiff = sessionStorage.getItem(DIFFICULTY_KEY);
    if (paid && storedDiff === opt.id) {
      router.push("/home/games/hexo-words");
    } else {
      setSelected(opt);
    }
  }

  async function handleConfirm() {
    if (!selected) return;

    if (profile.orbs < selected.orbCost) {
      toast.error(`Not enough orbs. You need ${selected.orbCost} orbs to play.`);
      return;
    }

    setConfirming(true);
    const ok = await setOrbs((prev) => prev - selected.orbCost);
    setConfirming(false);

    if (!ok) {
      toast.error("Failed to deduct orbs. Please try again.");
      return;
    }

    sessionStorage.setItem(DIFFICULTY_KEY, selected.id);
    sessionStorage.setItem(HW_PAID_KEY, "1");
    setSelected(null);
    router.push("/home/games/hexo-words");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col justify-center px-6 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30">
            <Shuffle className="h-8 w-8 text-blue-300" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">HexoWords</h1>
        <p className="mt-2 text-sm text-white/50">
          Choose a difficulty to begin. Each level changes the timer and available hints.
        </p>
      </div>

      {/* Difficulty cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:items-stretch">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isPaid = paidDifficulty === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleCardClick(opt)}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center rounded-2xl border bg-transparent px-8 pb-8 pt-10 text-center transition-all",
                opt.border,
                opt.hoverBorder,
              )}
            >
              {isPaid && (
                <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70 ring-1 ring-white/15">
                  Paid · Continue
                </span>
              )}
              {/* Icon */}
              <div
                className={cn(
                  "relative mb-7 flex h-24 w-24 items-center justify-center rounded-2xl ring-1 transition-all",
                  opt.iconBg,
                )}
              >
                <div className="absolute inset-0 rounded-2xl opacity-50 blur-md" />
                <Icon className={cn("relative h-12 w-12", opt.accent)} strokeWidth={1.5} />
              </div>

              {/* Label */}
              <h2 className={cn("text-xl font-bold", opt.accent)}>{opt.label}</h2>

              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {opt.description}
              </p>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Stats — 2×2 grid, always pinned to bottom */}
              <div className={cn(
                "mt-7 w-full grid grid-cols-2 gap-px overflow-hidden rounded-xl border",
                opt.statsBg,
              )}>
                {[
                  { value: opt.timer,         label: "Timer",       accent: true  },
                  { value: opt.pts,           label: "Per correct", accent: true  },
                  { value: opt.hint,          label: "Hints",       accent: false },
                  { value: null,              label: "Entry cost",  accent: true, isOrb: true },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 py-3 px-2">
                    {stat.isOrb ? (
                      <span className="flex items-center gap-1">
                        <img src="/orb.svg" alt="orbs" className="h-3.5 w-3.5" />
                        <span className={cn("text-sm font-bold", opt.accent)}>{opt.orbCost}</span>
                      </span>
                    ) : (
                      <span className={cn("text-sm font-bold", stat.accent ? opt.accent : "text-white/80")}>
                        {stat.value}
                      </span>
                    )}
                    <span className="text-xs text-white/40">{stat.label}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Back */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/65"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="border-white/10 bg-[#040c28] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selected?.label} — HexoWords
            </DialogTitle>
            <DialogDescription className="text-white/50">
              This difficulty costs{" "}
              <span className="font-semibold text-amber-400">
                {selected?.orbCost} orbs
              </span>{" "}
              to enter. You currently have{" "}
              <span
                className={cn(
                  "font-semibold",
                  profile.orbs >= (selected?.orbCost ?? 0)
                    ? "text-amber-400"
                    : "text-red-400",
                )}
              >
                {profile.orbs} orbs
              </span>.{" "}
              <span className="text-white/35">Entry fees are non-refundable.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-x-2">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="border-white/15 bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={profile.orbs < (selected?.orbCost ?? 0) || confirming}
              className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <img src="/orb.svg" alt="orbs" className="mr-1.5 h-3.5 w-3.5" />
              {confirming ? "Processing…" : `Spend ${selected?.orbCost} orbs & Play`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
