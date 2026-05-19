"use client";

import { useEffect, useState } from "react";
import { Crown, Medal, Info, Shuffle, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabaseClient";

interface Player {
  rank: number;
  username: string;
  fullName: string;
  avatar: string;
  points: number;
}


const MEDAL_COLORS: Record<number, string> = {
  1: "text-amber-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

const AVATAR_COLORS = [
  "bg-blue-600",   "bg-violet-600", "bg-emerald-600", "bg-rose-600",
  "bg-cyan-600",   "bg-orange-600", "bg-pink-600",    "bg-teal-600",
  "bg-indigo-600", "bg-red-600",    "bg-lime-600",    "bg-fuchsia-600",
  "bg-sky-600",    "bg-yellow-600", "bg-purple-600",
];

function avatarInitials(username: string): string {
  const parts = username.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

function HowPointsWork() {
  return (
    <div className="rounded-2xl border border-blue-500/25 bg-blue-500/6 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0 text-blue-400" />
        <h2 className="text-sm font-semibold text-blue-300">How points work</h2>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-white/55">
        Your score is the sum of your{" "}
        <span className="font-medium text-white/80">personal best</span> in each game.
        Only your highest run ever counts — not cumulative totals.
      </p>
      <div className="mb-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
        <div className="flex flex-col items-center gap-1 text-sm">
          <span className="flex items-center gap-1.5 text-white/60">
            <Shuffle className="h-3.5 w-3.5 text-blue-300" /> Best HexoWords
          </span>
          <span className="text-white/25">+</span>
          <span className="flex items-center gap-1.5 text-white/60">
            <Brain className="h-3.5 w-3.5 text-blue-300" /> Best HexoQuiz
          </span>
          <span className="text-white/25">=</span>
          <span className="font-semibold text-white">Leaderboard Score</span>
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">Example</p>
        <div className="space-y-2 text-sm text-white/55">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shuffle className="h-3.5 w-3.5 text-blue-300" /> HexoWords best
            </span>
            <span className="font-semibold text-white/80">100 pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-blue-300" /> HexoQuiz best
            </span>
            <span className="font-semibold text-white/80">200 pts</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/8 pt-2">
            <span className="font-medium text-white/70">Total</span>
            <span className="font-bold text-amber-400">300 pts</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/35">
          Beat your HexoQuiz record with 250 pts and your score auto-updates to{" "}
          <span className="font-medium text-white/55">350 pts</span>.
        </p>
      </div>
    </div>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return (
    <span className="w-5 text-center text-sm font-semibold text-white/40">
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name, pts")
        .order("pts", { ascending: false })
        .limit(100);

      if (data) {
        setPlayers(
          data.map((row, i) => ({
            rank: i + 1,
            username: row.username as string,
            fullName: (row.full_name as string) ?? "",
            avatar: avatarInitials(row.username as string),
            points: row.pts as number,
          })),
        );
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, []);

  const top3 = players.slice(0, 3);
  const [first, second, third] = [
    top3.find((p) => p.rank === 1),
    top3.find((p) => p.rank === 2),
    top3.find((p) => p.rank === 3),
  ];

  return (
    <div className="relative mx-auto w-full px-6 py-12" style={{ maxWidth: "1024px" }}>
      {/* Aside — absolutely positioned to the right, won't affect leaderboard layout */}
      <aside className="absolute left-full top-12 ml-6 hidden w-64 xl:block">
        <HowPointsWork />
      </aside>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="mt-1.5 text-white/45">
          Top players ranked by total points.{" "}
          <span className="text-amber-400/80 font-medium">#1 wins PHP 1,000</span> — awarded at the end of Day 2 (May 21).
        </p>
      </div>

        {/* ── Main leaderboard column ── */}
        <div>

      {loading ? (
        <>
          {/* Podium skeleton */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            {[28, 36, 24].map((h, i) => (
              <Skeleton key={i} className="rounded-2xl bg-white/5" style={{ height: `${h * 4}px` }} />
            ))}
          </div>
          {/* Table skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
            <div className="border-b border-white/8 px-5 py-3">
              <Skeleton className="h-3 w-40 bg-white/8" />
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-white/5 px-5 py-3.5 last:border-0">
                <Skeleton className="h-5 w-5 rounded-full bg-white/8" />
                <Skeleton className="h-8 w-8 rounded-full bg-white/8" />
                <Skeleton className="h-4 w-32 bg-white/8" />
                <Skeleton className="ml-auto h-4 w-16 bg-white/8" />
              </div>
            ))}
          </div>
        </>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-white/60 font-medium">No players yet</p>
          <p className="mt-1 text-sm text-white/30">Be the first to play and claim the top spot!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {second && first && third && (
            <div className="mb-8 grid grid-cols-3 gap-4">
              {[second, first, third].map((p, i) => {
                const order = [2, 1, 3][i];
                const heights = ["h-28", "h-36", "h-24"];
                const borderColors = [
                  "border-slate-300/30",
                  "border-amber-400/40",
                  "border-amber-600/30",
                ];
                const bgColors = [
                  "bg-slate-300/5",
                  "bg-amber-400/8",
                  "bg-amber-600/5",
                ];

                return (
                  <div
                    key={p.rank}
                    className={cn(
                      "flex flex-col items-center justify-end rounded-2xl border px-4 pb-5 pt-4",
                      heights[i],
                      borderColors[i],
                      bgColors[i],
                    )}
                  >
                    <div
                      className={cn(
                        "mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                        AVATAR_COLORS[(p.rank - 1) % AVATAR_COLORS.length],
                      )}
                    >
                      {p.avatar}
                    </div>
                    <p className="max-w-full truncate text-sm font-semibold text-white">
                      {p.fullName || p.username}
                    </p>
                    {p.fullName && (
                      <p className="max-w-full truncate text-xs text-white/40">@{p.username}</p>
                    )}
                    <p className={cn("text-xs font-bold", MEDAL_COLORS[order])}>
                      {p.points.toLocaleString()} pts
                    </p>
                    <div className="mt-1.5 flex h-5 w-5 items-center justify-center">
                      <RankIcon rank={order} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
            <div className="grid grid-cols-[2.5rem_1fr_auto] gap-4 border-b border-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/35">
              <span>#</span>
              <span>Player</span>
              <span className="w-24 text-right">Points</span>
            </div>

            {players.map((p, idx) => (
              <div
                key={p.rank}
                className={cn(
                  "grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/4",
                  idx !== players.length - 1 && "border-b border-white/5",
                )}
              >
                <div className="flex justify-center">
                  <RankIcon rank={p.rank} />
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      AVATAR_COLORS[(p.rank - 1) % AVATAR_COLORS.length],
                    )}
                  >
                    {p.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white leading-tight">
                      {p.fullName || p.username}
                    </p>
                    {p.fullName && (
                      <p className="text-xs text-white/35 leading-tight">@{p.username}</p>
                    )}
                  </div>
                </div>

                <span
                  className={cn(
                    "w-24 text-right text-sm font-semibold",
                    p.rank <= 3 ? MEDAL_COLORS[p.rank] : "text-white/70",
                  )}
                >
                  {p.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-white/25">
            2-day event · May 20–21, 2026 · Prize awarded end of Day 2
          </p>
        </>
      )}

        {/* Stacked aside — only shown below xl */}
        <div className="xl:hidden mt-8">
          <HowPointsWork />
        </div>

        </div>{/* end main column */}
    </div>
  );
}

