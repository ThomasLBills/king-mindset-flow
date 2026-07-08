import { useEffect, useState } from "react";
import { UserRoundCog, X } from "lucide-react";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";

const formatRemaining = (expiresAtSec: number) => {
  const remaining = Math.max(0, expiresAtSec * 1000 - Date.now());
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const ImpersonationBanner = () => {
  const { isImpersonating, target, expiresAt, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!isImpersonating) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [isImpersonating]);

  if (!isImpersonating || !target || !expiresAt) return null;

  const name = target.display_name || target.first_name || target.email;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center justify-between gap-3 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-md"
    >
      <div className="flex min-w-0 items-center gap-2">
        <UserRoundCog className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">
          Viewing as <strong>{name}</strong>
          <span className="hidden sm:inline"> ({target.email})</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums opacity-90">{formatRemaining(expiresAt)}</span>
        <button
          type="button"
          onClick={async () => {
            await stopImpersonation();
            navigate("/admin/users");
          }}
          className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/25"
        >
          <X className="h-3.5 w-3.5" /> Exit
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;