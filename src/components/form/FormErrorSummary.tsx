import { useEffect, useRef } from "react";
import type { FieldErrors } from "react-hook-form";
import { AlertCircle } from "lucide-react";

export function FormErrorSummary({ errors, submitCount }: { errors: FieldErrors; submitCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const messages = Object.values(errors)
    .map((e) => (e && "message" in e ? String((e as { message?: unknown }).message ?? "") : ""))
    .filter(Boolean);

  useEffect(() => {
    if (submitCount > 0 && messages.length) ref.current?.focus();
  }, [submitCount, messages.length]);

  if (submitCount === 0 || messages.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive outline-none"
    >
      <p className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-4 w-4" aria-hidden /> Please fix the following:
      </p>
      <ul className="mt-1 list-disc pl-6">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
