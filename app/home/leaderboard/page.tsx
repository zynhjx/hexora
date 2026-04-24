"use client";

import { useEffect, useState } from "react";
import { Crown, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabaseClient";

interface Player {
  rank: number;
  username: string;
  avatar: string;
  points: number;
}

const SAMPLE_PLAYERS: Player[] = [
  { rank: 1,  username: "cipherxhunter",  avatar: "CH", points: 14820 },
  { rank: 2,  username: "n3t_hawk",        avatar: "NH", points: 13450 },
  { rank: 3,  username: "zeroDB",          avatar: "ZD", points: 12305 },
  { rank: 4,  username: "ph4ntom_root",    avatar: "PR", points: 11780 },
  { rank: 5,  username: "vulnscanner99",   avatar: "VS", points: 10990 },
  { rank: 6,  username: "infosec_kyoru",   avatar: "IK", points: 9870  },
  { rank: 7,  username: "packet_storm",    avatar: "PS", points: 9120  },
  { rank: 8,  username: "shellcoder",      avatar: "SC", points: 8460  },
  { rank: 9,  username: "malw4re_mage",    avatar: "MM", points: 7890  },
  { rank: 10, username: "redteam_rio",     avatar: "RR", points: 7340  },
  { rank: 11, username: "bytebr34ker",     avatar: "BB", points: 6810  },
  { rank: 12, username: "xss_phantom",     avatar: "XP", points: 6250  },
  { rank: 13, username: "hash_cracker7",   avatar: "HC", points: 5700  },
  { rank: 14, username: "darkpr0xy",       avatar: "DP", points: 5120  },
  { rank: 15, username: "l0gin_bypass",    avatar: "LB", points: 4530  },
];

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
  const [players, setPlayers] = useState<Player[]>(SAMPLE_PLAYERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("rank, username, pts")
        .limit(100);

      if (!error && data && data.length > 0) {
        setPlayers(
          data.map((row) => ({
            rank: Number(row.rank),
            username: row.username as string,
            avatar: avatarInitials(row.username as string),
            points: row.pts as number,
          })),
        );
      }
      // If error or empty, keep sample data
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
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="mt-1.5 text-white/45">
          Top players ranked by total points. #1 wins PHP 1,000 every season.
        </p>
      </div>

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
                      {p.username}
                    </p>
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
                  <span className="text-sm font-medium text-white">
                    {p.username}
                  </span>
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
            Season resets every 30 days
          </p>
        </>
      )}
    </div>
  );
}

