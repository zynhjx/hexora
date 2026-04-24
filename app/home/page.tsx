"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, Brain } from "lucide-react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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

const ENTRY_COST = 10;

interface Game {
  id: number;
  title: string;
  description: string;
  icon: ElementType;
  route: string;
}

const games: Game[] = [
  {
    id: 1,
    title: "HexoWords",
    description:
      "Unscramble cybersecurity terms from a hint. Beat the clock for bonus points!",
    icon: Shuffle,
    route: "/home/games/hexo-words",
  },
  {
    id: 2,
    title: "HexoQuiz",
    description:
      "Test your cybersecurity knowledge with rapid-fire questions. Answer fast and climb the leaderboard!",
    icon: Brain,
    route: "/home/games/hexo-quiz",
  },
];

function GameCard({
  game,
  onPlay,
}: {
  game: Game;
  onPlay: (game: Game) => void;
}) {
  const Icon = game.icon;
  return (
    <div
      onClick={() => onPlay(game)}
      className="relative cursor-pointer rounded-2xl border border-blue-500/25 bg-blue-500/8 p-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/14"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
        <Icon className="h-5 w-5 text-white" />
      </div>

      <h2 className="text-base font-semibold text-white">{game.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">
        {game.description}
      </p>

      <div className="mt-5 flex items-center justify-end">
        <span className="flex items-center gap-1 text-xs text-blue-300/70">
          <img src="/orb.svg" alt="orbs" className="h-3 w-3" />
          {ENTRY_COST} orbs
        </span>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const router = useRouter();
  const { profile, loading, setOrbs } = useUser();
  const orbs = profile.orbs;
  const [selected, setSelected] = useState<Game | null>(null);

  const SESSION_KEYS: Record<string, string> = {
    "/home/games/hexo-words": "hexora:jl:startTime",
    "/home/games/hexo-quiz": "hexora:hq:startTime",
  };

  function handlePlay(game: Game) {
    // Skip dialog if the user already has an active session or a pending paid token
    const hasSession = sessionStorage.getItem(SESSION_KEYS[game.route] ?? "");
    const hasPaidToken = sessionStorage.getItem(`hexora:paid:${game.route}`);
    if (hasSession || hasPaidToken) {
      router.push(game.route);
      return;
    }
    setSelected(game);
  }

  async function handleConfirm() {
    if (!selected) return;
    // If there's already an active session or a pending paid token, resume without charging
    const hasSession = sessionStorage.getItem(SESSION_KEYS[selected.route] ?? "");
    const hasPaidToken = sessionStorage.getItem(`hexora:paid:${selected.route}`);
    if (hasSession || hasPaidToken) {
      setSelected(null);
      router.push(selected.route);
      return;
    }
    if (orbs < ENTRY_COST) {
      toast.error(`Not enough orbs. You need ${ENTRY_COST} orbs to play.`);
      return;
    }
    await setOrbs((prev) => prev - ENTRY_COST);
    // Write a one-time entry token so the game page knows orbs were paid
    sessionStorage.setItem(`hexora:paid:${selected.route}`, "1");
    setSelected(null);
    router.push(selected.route);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Greeting */}
      <div className="mb-10">
        <p className="text-sm font-medium text-white/40">Welcome back,</p>
        {loading ? (
          <Skeleton className="h-9 w-48 bg-white/8" />
        ) : (
          <h1 className="text-3xl font-bold text-white">
            {profile.username.replace(/[_\-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </h1>
        )}
      </div>

      {/* Games section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Start Your Journey</h2>
        <p className="mt-1 text-sm text-white/45">
          Choose a game and put your cybersecurity knowledge to the test.
        </p>
      </div>

      {/* Snake path — desktop */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-2 gap-4 items-stretch">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onPlay={handlePlay} />
          ))}
        </div>
      </div>

      {/* Single-column list — mobile */}
      <div className="flex flex-col gap-3 sm:hidden">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onPlay={handlePlay} />
        ))}
      </div>

      {/* Entry confirmation dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="border-white/10 bg-[#040c28] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">{selected?.title}</DialogTitle>
            <DialogDescription className="text-white/50">
              This game costs{" "}
              <span className="font-semibold text-amber-400">
                {ENTRY_COST} orbs
              </span>{" "}
              to enter. You currently have{" "}
              <span className={cn("font-semibold", orbs >= ENTRY_COST ? "text-amber-400" : "text-red-400")}>
                {orbs} orbs
              </span>.{" "}
              <span className="text-white/35">Entry fees are non-refundable.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-x-2 bg-[#051036]">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="border-white/15 bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={orbs < ENTRY_COST}
              className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <img src="/orb.svg" alt="orbs" className="mr-1.5 h-3.5 w-3.5" />
              Spend {ENTRY_COST} orbs &amp; Play
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
