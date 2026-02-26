import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  /** Show just a dot instead of a count */
  dot?: boolean;
}

const NotificationBadge = ({ count, className, dot }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  if (dot) {
    return (
      <span
        className={cn(
          "pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background",
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "pointer-events-none absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none px-[3px] border-[1.5px] border-background",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBadge;
