/**
 * The member app shell: desktop nav rail, mobile top bar + bottom tab bar,
 * the persistent "Stand Firm" SOS action (one tap from anywhere), and a
 * global account menu (Profile / Billing / Sign out).
 */
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, ChevronsUpDown, Home, LogOut, Shield, ShieldCheck, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useForgeUser } from "@/hooks/useForgeProfile";
import { useUnread } from "@/contexts/UnreadContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { LkMonogram, LkWordmark } from "@/components/forge/brand";
import { InitialsAvatar } from "@/components/forge/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/brotherhood", label: "Brotherhood", icon: Users, end: false },
  { to: "/app/grow", label: "Path", icon: BookOpen, end: false },
  { to: "/app/profile", label: "Profile", icon: UserRound, end: false },
] as const;

const useUnreadCount = () => {
  const { counts } = useUnread();
  return counts.total;
};

const UnreadBadge = ({ count, className }: { count: number; className?: string }) => {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 font-display text-[10px] font-bold leading-none text-primary-foreground",
        className
      )}
    >
      {count}
      <span className="sr-only"> unread messages</span>
    </span>
  );
};

/** Profile / Billing / Sign out, reachable from every screen. */
const AccountMenu = ({ trigger }: { trigger: React.ReactNode }) => {
  const { user } = useForgeUser();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  return (
    // modal={false}: a modal dropdown locks body scroll (react-remove-scroll),
    // which compensates for the hidden scrollbar by padding the body and shoves
    // the whole layout sideways / leaves a gap. A menu doesn't need scroll
    // locking, so opting out keeps the layout stable when it opens.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-dim">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/app/profile")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/app/billing")}>Billing</DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/admin")}>
              <ShieldCheck className="mr-2 h-4 w-4 text-gold" aria-hidden="true" /> Admin
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-ember focus:text-ember"
          onSelect={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const railLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium",
    "transition-colors hover:bg-raised hover:text-bone",
    isActive
      ? "border-line bg-gradient-to-b from-raised-2 to-raised text-bone shadow-[inset_2px_0_0_hsl(var(--primary))]"
      : "text-bone-2"
  );

const NavRail = () => {
  const { user } = useForgeUser();
  const unread = useUnreadCount();
  return (
    <aside className="sticky top-[var(--impersonation-offset,0px)] hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-forge-2 px-4 py-5 lg:flex">
      <Link to="/app" className="mb-6 block px-1.5" aria-label="Liberated Kings, back to Today">
        <LkWordmark className="h-9 w-auto" />
      </Link>
      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={railLink}>
            {({ isActive }) => (
              <>
                <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-gold" : "text-dim")} aria-hidden="true" />
                {label}
                {label === "Brotherhood" && <UnreadBadge count={unread} className="ml-auto" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1" />
      <Link
        to="/stand-firm"
        className={cn(
          "flex items-center gap-2.5 rounded-md border border-gold-deep px-3.5 py-3",
          "bg-gradient-to-b from-[hsl(24_41%_12%)] to-[hsl(26_45%_9%)] text-gold-bright",
          "font-display text-xs font-bold uppercase tracking-[0.1em]",
          "transition-[filter] hover:brightness-110"
        )}
      >
        <Shield className="h-[18px] w-[18px]" aria-hidden="true" />
        Stand Firm
      </Link>
      <AccountMenu
        trigger={
          <button
            className="mt-4 flex w-full items-center gap-2.5 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-raised"
            aria-label="Account menu"
          >
            <InitialsAvatar initials={user?.initials ?? "LK"} className="h-7 w-7 text-[11px]" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-bone-2">
              {user?.name}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-dim" aria-hidden="true" />
          </button>
        }
      />
    </aside>
  );
};

const MobileTopBar = () => {
  const { user } = useForgeUser();
  const { isImpersonating } = useImpersonation();
  return (
    <header
      className={cn(
        "sticky top-[var(--impersonation-offset,0px)] z-20 flex items-center justify-between border-b border-line-soft px-4 pb-3 lg:hidden",
        // While impersonating, the banner sits directly above this bar. A
        // translucent, blurred bar lets the page content bleed through in
        // that seam and reads as an ugly gap. Make it fully opaque so the
        // banner and top bar visually connect.
        isImpersonating ? "bg-forge" : "bg-forge/80 backdrop-blur-md",
        // The banner already accounts for env(safe-area-inset-top) inside
        // --impersonation-offset, so skip our own safe-area padding while
        // impersonating to avoid stacking that inset twice.
        isImpersonating ? "pt-3" : "pt-[max(env(safe-area-inset-top),0.75rem)]"
      )}
    >
      <Link to="/app" aria-label="Liberated Kings, back to Today">
        <LkMonogram className="h-7 w-9" />
      </Link>
      <AccountMenu
        trigger={
          <button aria-label="Account menu" className="rounded-full">
            <InitialsAvatar initials={user?.initials ?? "LK"} className="h-8 w-8" />
          </button>
        }
      />
    </header>
  );
};

const tabLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex flex-col items-center gap-1 py-1 text-[10px] font-semibold",
    isActive ? "text-gold" : "text-dim"
  );

const MobileTabBar = () => {
  const unread = useUnreadCount();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-forge/90 px-1.5 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-md lg:hidden"
    >
      <NavLink to="/app" end className={tabLink}>
        <Home className="h-[22px] w-[22px]" aria-hidden="true" />
        Home
      </NavLink>
      <NavLink to="/app/brotherhood" className={tabLink}>
        <span className="relative">
          <Users className="h-[22px] w-[22px]" aria-hidden="true" />
          <UnreadBadge count={unread} className="absolute -right-2.5 -top-1" />
        </span>
        Brothers
      </NavLink>
      {/* Armor: keeps its raised circle but now sits in the grid like the
          other tabs, with a label, so it reads as a proper nav item. */}
      <Link to="/stand-firm" className="flex flex-col items-center gap-1" aria-label="Armor">
        <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full border border-gold-deep bg-gradient-to-b from-[hsl(24_41%_12%)] to-[hsl(26_45%_9%)] text-gold-bright shadow-[0_6px_18px_-6px_rgba(0,0,0,0.7)]">
          <Shield className="h-[22px] w-[22px]" aria-hidden="true" />
        </span>
        <span className="text-[10px] font-semibold text-dim">Armor</span>
      </Link>
      <NavLink to="/app/grow" className={tabLink}>
        <BookOpen className="h-[22px] w-[22px]" aria-hidden="true" />
        Path
      </NavLink>
      <NavLink to="/app/profile" className={tabLink}>
        <UserRound className="h-[22px] w-[22px]" aria-hidden="true" />
        Profile
      </NavLink>
    </nav>
  );
};

const AppShell = () => (
  // The content column - not the document - is the scroll container, and it
  // reserves its scrollbar gutter (scrollbar-gutter: stable). That keeps the
  // column a constant width whether or not a page scrolls, so the shared page
  // backdrop no longer shifts a few px when moving between short pages
  // (Brotherhood) and tall ones (Today/Grow/Profile). Because the document
  // itself never scrolls, Radix dialogs have no document scrollbar to
  // compensate for, so they don't shift the layout on open either.
  <div className="h-dvh overflow-hidden bg-background lg:flex">
    <NavRail />
    <div id="app-scroll" className="h-dvh min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
      <MobileTopBar />
      <main className="pb-28 lg:pb-0">
        <Outlet />
      </main>
    </div>
    <MobileTabBar />
  </div>
);

export default AppShell;
