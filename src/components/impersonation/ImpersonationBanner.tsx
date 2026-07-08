import { useEffect } from "react";
import { UserRoundCog, X } from "lucide-react";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";

export const ImpersonationBanner = () => {
  const { isImpersonating, target, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  // Publish a CSS variable other layouts read to offset their sticky/fixed
  // top elements (app header, chat header) so nothing hides behind the banner.
  useEffect(() => {
    if (!isImpersonating) return;
    const OFFSET = "calc(40px + env(safe-area-inset-top, 0px))";
    document.documentElement.style.setProperty("--impersonation-offset", OFFSET);
    return () => {
      document.documentElement.style.removeProperty("--impersonation-offset");
    };
  }, [isImpersonating]);

  if (!isImpersonating || !target) return null;

  const name = target.display_name || target.first_name || target.email;

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-md pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <UserRoundCog className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">
          Impersonating <strong>{name}</strong>
          <span className="hidden sm:inline"> ({target.email})</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            await stopImpersonation();
            navigate("/admin/users");
          }}
          className="inline-flex items-center gap-1 rounded-md bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/30 active:bg-white/40"
        >
          <X className="h-3.5 w-3.5" /> Exit
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;