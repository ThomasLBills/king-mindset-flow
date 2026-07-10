import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={cn("space-y-3 py-6", className)}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
