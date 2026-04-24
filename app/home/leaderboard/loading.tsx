import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <Skeleton className="mb-2 h-9 w-44 bg-white/8" />
        <Skeleton className="h-4 w-80 bg-white/8" />
      </div>

      {/* Podium */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[28, 36, 24].map((h, i) => (
          <Skeleton
            key={i}
            className="rounded-2xl bg-white/5"
            style={{ height: `${h * 4}px` }}
          />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        {/* Header row */}
        <div className="border-b border-white/8 px-5 py-3">
          <Skeleton className="h-3 w-40 bg-white/8" />
        </div>

        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/5 px-5 py-3.5 last:border-0"
          >
            <Skeleton className="h-5 w-5 rounded-full bg-white/8" />
            <Skeleton className="h-8 w-8 rounded-full bg-white/8" />
            <Skeleton className="h-4 w-32 bg-white/8" />
            <Skeleton className="ml-auto h-4 w-16 bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}
