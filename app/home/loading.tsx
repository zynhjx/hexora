import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Greeting */}
      <div className="mb-10">
        <Skeleton className="mb-2 h-4 w-28 bg-white/8" />
        <Skeleton className="h-9 w-48 bg-white/8" />
      </div>

      {/* Section heading */}
      <div className="mb-4">
        <Skeleton className="mb-2 h-6 w-44 bg-white/8" />
        <Skeleton className="h-4 w-72 bg-white/8" />
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/8 bg-white/3 p-6"
          >
            <Skeleton className="mb-5 h-12 w-12 rounded-xl bg-white/8" />
            <Skeleton className="mb-2 h-5 w-32 bg-white/8" />
            <Skeleton className="h-4 w-full bg-white/8" />
            <Skeleton className="mt-1 h-4 w-3/4 bg-white/8" />
            <div className="mt-5 flex justify-end">
              <Skeleton className="h-4 w-16 bg-white/8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
