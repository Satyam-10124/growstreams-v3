"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`gs-skeleton ${className}`} aria-hidden />;
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[#0c1018] rounded-xl border border-[#1a2030] shadow-2xl overflow-hidden p-4" aria-hidden>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-28 mb-2" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      role="status"
      aria-label="Loading stats"
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowsSkeleton({
  rows = 5,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`bg-[#0c1018] rounded-xl border border-[#1a2030] shadow-2xl overflow-hidden divide-y divide-[#1a2030] ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-8 w-8 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-1 w-3/4" />
          </div>
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#0c1018] rounded-xl border border-[#1a2030] shadow-2xl overflow-hidden p-5 space-y-3 ${className}`} aria-hidden>
      <Skeleton className="h-4 w-32" />
      <SkeletonText lines={3} />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

