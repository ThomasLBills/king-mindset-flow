import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

export type ToolKey = "tempted" | "return" | "scripture" | "truth" | "gratitude";

interface HelpMeNowModalProps {
  onClose: () => void;
  onOpenTool: (tool: ToolKey) => void;
}

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  toolCta?: { key: ToolKey; label: string };
}

const QUICK_OPTIONS: { label: string; tool: ToolKey; toolLabel: string }[] = [
  { label: "I feel tempted", tool: "tempted", toolLabel: "I'm Being Tempted" },
  { label: "I already slipped", tool: "return", toolLabel: "I Need to Return" },
  { label: "I feel anxious", tool: "scripture", toolLabel: "Open Scripture" },
  { label: "I need to be reminded of truth", tool: "truth", toolLabel: "Speak Truth Over Myself" },
  { label: "I'm doing well, just grounding", tool: "gratitude", toolLabel: "Open Gratitude" },
];

const HelpMeNowModal = ({ onClose, onOpenTool }: HelpMeNowModalProps) => {
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", text: "What's going on right now?" },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, isSending]);

  const sendMessage = async (text: string, toolKey: ToolKey, toolLabel: string) => {
    if (isSending) return;
    setIsSending(true);
    setHasSent(true);
    setTurns((prev) => [...prev, { role: "user", text }]);

    try {
      const { data, error } = await supabase.functions.invoke("help-me-now", {
        body: { message: text },
      });
      if (error) throw error;
      const reply: string = data?.reply || "You are not alone here. Let's take the next step together.";
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: reply, toolCta: { key: toolKey, label: toolLabel } },
      ]);
    } catch (e: any) {
      const msg = e?.context?.body
        ? (() => {
            try {
              return JSON.parse(e.context.body)?.error;
            } catch {
              return null;
            }
          })()
        : null;
      toast.error(msg || "Something went wrong. Please try again.");
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm here. Let's take a breath and step into truth together.",
          toolCta: { key: toolKey, label: toolLabel },
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ fontFamily: systemSans }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="dark-card-gradient w-full sm:max-w-lg sm:rounded-[16px] rounded-t-[20px] flex flex-col"
        style={{
          maxHeight: "90vh",
          height: "90vh",
          paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
          color: "#F5F3EE",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid rgba(245, 243, 238, 0.06)" }}
        >
          <div>
            <p
              className="uppercase"
              style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}
            >
              Help Me Right Now
            </p>
            <p style={{ fontSize: "13px", color: "rgba(245, 243, 238, 0.6)", marginTop: 2 }}>
              You are not alone in this moment
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X size={18} color="#F5F3EE" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          {turns.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="rounded-[14px] px-4 py-3 max-w-[85%]"
                style={
                  turn.role === "user"
                    ? {
                        background: "rgba(184, 150, 63, 0.18)",
                        color: "#F5F3EE",
                        fontSize: "14px",
                        lineHeight: 1.5,
                      }
                    : {
                        background: "#242424",
                        color: "#F5F3EE",
                        fontSize: "14px",
                        lineHeight: 1.55,
                      }
                }
              >
                <p>{turn.text}</p>
                {turn.toolCta && (
                  <button
                    onClick={() => {
                      onOpenTool(turn.toolCta!.key);
                      onClose();
                    }}
                    className="mt-3 w-full rounded-[10px] flex items-center justify-center transition-transform active:scale-[0.97]"
                    style={{
                      padding: "11px 14px",
                      background: "#B8963F",
                      color: "#1A1A1A",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: 0,
                    }}
                  >
                    {turn.toolCta.label}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div
                className="rounded-[14px] px-4 py-3 flex items-center gap-2"
                style={{ background: "#242424", color: "rgba(245, 243, 238, 0.6)", fontSize: "13px" }}
              >
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick options */}
        {!hasSent && (
          <div className="px-5 pb-5 pt-2">
            <p
              className="uppercase mb-3"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                color: "rgba(245, 243, 238, 0.5)",
              }}
            >
              Choose what fits
            </p>
            <div className="flex flex-col gap-[8px]">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => sendMessage(opt.label, opt.tool, opt.toolLabel)}
                  disabled={isSending}
                  className="text-left rounded-[10px] transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={{
                    padding: "13px 16px",
                    background: "#242424",
                    color: "#F5F3EE",
                    fontSize: "14px",
                    fontWeight: 500,
                    border: 0,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSent && !isSending && turns[turns.length - 1]?.toolCta && (
          <div className="px-5 pb-5 pt-1">
            <button
              onClick={onClose}
              className="w-full rounded-[10px] transition-colors"
              style={{
                padding: "12px",
                background: "transparent",
                color: "rgba(245, 243, 238, 0.6)",
                fontSize: "13px",
                fontWeight: 500,
                border: "1px solid rgba(245, 243, 238, 0.1)",
              }}
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default HelpMeNowModal;