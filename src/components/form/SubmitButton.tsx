import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  pending,
  pendingLabel,
  children,
  disabled,
  ...props
}: ButtonProps & { pending?: boolean; pendingLabel?: string }) {
  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending} {...props}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
      {pending ? (pendingLabel ?? "Working…") : children}
    </Button>
  );
}
