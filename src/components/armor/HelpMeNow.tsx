/**
 * "Help Me Right Now" — a light triage. Pick what's going on; a short
 * encouragement comes back from the help-me-now edge function (with a canned
 * fallback if it's unavailable), then a CTA routes into the matching tool.
 * Logs no evidence itself.
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/forge/atoms";
import { BackTo } from "./frame";

export type ToolKey = "tempted" | "return" | "scripture" | "truth" | "gratitude";

const QUICK_OPTIONS: { label: string; tool: ToolKey; toolLabel: string }[] = [
  { label: "I feel tempted", tool: "tempted", toolLabel: "I'm Being Tempted" },
  { label: "I already slipped", tool: "return", toolLabel: "I Need to Return" },
  { label: "I feel anxious", tool: "scripture", toolLabel: "Open Scripture" },
  { label: "I need to be reminded of truth", tool: "truth", toolLabel: "Speak Truth Over Myself" },
  { label: "I'm doing well, just grounding", tool: "gratitude", toolLabel: "Open Gratitude" },
];

type Option = (typeof QUICK_OPTIONS)[number];

export const HelpMeNow = ({
  onBack,
  onOpenTool,
}: {
  onBack: () => void;
  onOpenTool: (tool: ToolKey) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Option | null>(null);
  const [failed, setFailed] = useState(false);

  const pick = async (opt: Option) => {
    setChosen(opt);
    setLoading(true);
    setReply(null);
    setFailed(false);
    try {
      const { data, error } = await supabase.functions.invoke("help-me-now", {
        body: { message: opt.label },
      });
      if (error) throw error;
      setReply(
        (data as { reply?: string } | null)?.reply ||
          "You are not alone here. Let's take the next step together."
      );
    } catch (err) {
      // Crisis-safe: still show a grounding message + the tool CTA so the man is
      // never left with nothing, but surface that guidance is offline with a
      // retry (the edge function is a raw invoke, so no global-net coverage).
      console.error("[help-me-now] edge function failed:", err);
      setReply("I'm here. Let's take a breath and step into truth together.");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Eyebrow tone="gold" className="mb-1">
        Help Me Right Now
      </Eyebrow>
      <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
        You are not alone in this moment
      </h1>
      <p className="mb-6 mt-2 text-[15px] leading-relaxed text-bone-2">What's going on right now?</p>

      {loading || reply ? (
        <div className="w-full">
          {loading ? (
            <p className="flex items-center justify-center gap-2 text-sm text-bone-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Thinking…
            </p>
          ) : (
            <>
              <p className="rounded-md border border-line bg-raised/80 px-4 py-3 text-left text-[15px] leading-relaxed text-bone">
                {reply}
              </p>
              {failed && (
                <p
                  role="status"
                  className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-dim"
                >
                  We couldn't reach live guidance just now.
                  <button
                    onClick={() => chosen && pick(chosen)}
                    className="font-medium text-gold underline-offset-4 hover:underline"
                  >
                    Try again
                  </button>
                </p>
              )}
              {chosen && (
                <Button className="mt-5 w-full" size="lg" onClick={() => onOpenTool(chosen.tool)}>
                  {chosen.toolLabel}
                </Button>
              )}
              <button
                className="mx-auto mt-4 block text-sm text-dim transition-colors hover:text-bone-2"
                onClick={() => {
                  setReply(null);
                  setChosen(null);
                }}
              >
                Choose something else
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <Eyebrow className="mb-3 block">Choose what fits</Eyebrow>
          <div className="flex w-full flex-col gap-2.5">
            {QUICK_OPTIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => pick(o)}
                className="w-full rounded-lg border border-line bg-raised px-4 py-3 text-left text-sm font-medium text-bone-2 transition-colors hover:border-gold-deep hover:bg-raised-2"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}

      <BackTo onClick={onBack} label="Back to Your Armor" />
    </>
  );
};
