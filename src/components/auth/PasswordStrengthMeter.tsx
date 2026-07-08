import { Check, X } from "lucide-react";
import { evaluatePassword } from "@/lib/passwordStrength";
import { cn } from "@/lib/utils";

type Props = {
  password: string;
  className?: string;
  showChecklist?: boolean;
};

const BAR_COLORS: Record<string, string> = {
  empty: "bg-muted",
  weak: "bg-destructive",
  fair: "bg-amber-500",
  good: "bg-yellow-500",
  strong: "bg-emerald-500",
};

const LABEL_COLORS: Record<string, string> = {
  empty: "text-muted-foreground",
  weak: "text-destructive",
  fair: "text-amber-600",
  good: "text-yellow-600",
  strong: "text-emerald-600",
};

export const PasswordStrengthMeter = ({
  password,
  className,
  showChecklist = true,
}: Props) => {
  const result = evaluatePassword(password);
  const segments = 5;
  const filled = result.score;

  return (
    <div
      className={cn("space-y-2", className)}
      aria-live="polite"
      data-testid="password-strength-meter"
    >
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < filled ? BAR_COLORS[result.level] : "bg-muted",
            )}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p
          className={cn(
            "text-xs font-medium",
            LABEL_COLORS[result.level],
          )}
          data-strength={result.level}
        >
          {result.message}
        </p>
      )}
      {showChecklist && password.length > 0 && !result.meetsRequirements && (
        <ul className="space-y-1 pt-1">
          {result.checks.map((c) => (
            <li
              key={c.label}
              className={cn(
                "flex items-center gap-2 text-xs",
                c.passed ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {c.passed ? (
                <Check className="w-3 h-3 flex-shrink-0" />
              ) : (
                <X className="w-3 h-3 flex-shrink-0 opacity-60" />
              )}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;