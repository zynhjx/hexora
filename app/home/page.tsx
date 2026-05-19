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
  gameRoute: string;
  sessionKey: string;
  orbGated: boolean;
}

const games: Game[] = [
  {
    id: 1,
    title: "HexoWords",
    description:
      "Unscramble cybersecurity terms from a hint. Beat the clock for bonus points!",
    icon: Shuffle,
    route: "/home/games/hexo-words/difficulty",
    gameRoute: "/home/games/hexo-words",
    sessionKey: "hexora:jl:startTime",
    orbGated: false,
  },
  {
    id: 2,
    title: "HexoQuiz",
    description:
      "Test your cybersecurity knowledge with rapid-fire questions. Answer fast and climb the leaderboard!",
    icon: Brain,
    route: "/home/games/hexo-quiz/difficulty",
    gameRoute: "/home/games/hexo-quiz",
    sessionKey: "hexora:hq:startTime",
    orbGated: false,
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
      className="group relative flex cursor-pointer flex-col items-center rounded-2xl border border-blue-500/20 bg-blue-500/6 px-6 pb-7 pt-10 text-center transition-all hover:border-blue-400/40 hover:bg-blue-500/12"
    >
      {/* Icon */}
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30 transition-all group-hover:bg-blue-600/30 group-hover:ring-blue-400/50">
        <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-md" />
        <Icon className="relative h-12 w-12 text-blue-300" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <h2 className="text-lg font-bold text-white">{game.title}</h2>
      <p className="mt-2.5 text-sm leading-relaxed text-white/50">
        {game.description}
      </p>

      {/* Entry cost — only for orb-gated games */}
      {game.orbGated && (
        <div className="mt-6 flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300/80">
          <img src="/orb.svg" alt="orbs" className="h-3 w-3" />
          {ENTRY_COST} orbs to play
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  const router = useRouter();
  const { profile, loading, setOrbs } = useUser();
  const orbs = profile.orbs;
  const [confirming, setConfirming] = useState(false);
  const [selected, setSelected] = useState<Game | null>(null);

  function handlePlay(game: Game) {
    const hasActiveSession = sessionStorage.getItem(game.sessionKey);

    // Resume active session directly
    if (hasActiveSession) {
      router.push(game.gameRoute);
      return;
    }

    // Non-orb-gated games go straight to their entry route (e.g. difficulty picker)
    if (!game.orbGated) {
      router.push(game.route);
      return;
    }

    // Orb-gated: check for a pending paid token
    const hasPaidToken = sessionStorage.getItem(`hexora:paid:${game.gameRoute}`);
    if (hasPaidToken) {
      router.push(game.gameRoute);
      return;
    }

    setSelected(game);
  }

  async function handleConfirm() {
    if (!selected) return;
    const hasActiveSession = sessionStorage.getItem(selected.sessionKey);
    const hasPaidToken = sessionStorage.getItem(`hexora:paid:${selected.gameRoute}`);
    if (hasActiveSession || hasPaidToken) {
      setSelected(null);
      router.push(selected.gameRoute);
      return;
    }
    if (orbs < ENTRY_COST) {
      toast.error(`Not enough orbs. You need ${ENTRY_COST} orbs to play.`);
      return;
    }
    setConfirming(true);
    const ok = await setOrbs((prev) => prev - ENTRY_COST);
    setConfirming(false);
    if (!ok) {
      toast.error("Failed to deduct orbs. Please try again.");
      return;
    }
    sessionStorage.setItem(`hexora:paid:${selected.gameRoute}`, "1");
    setSelected(null);
    router.push(selected.gameRoute);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              disabled={orbs < ENTRY_COST || confirming}
              className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <img src="/orb.svg" alt="orbs" className="mr-1.5 h-3.5 w-3.5" />
              {confirming ? "Deducting…" : `Spend ${ENTRY_COST} orbs & Play`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
