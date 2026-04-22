import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Send, Heart, Shield, MessageCircle, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useBrothers } from "@/hooks/useBrotherhood";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ChatTarget } from "@/hooks/useChat";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const templates = [
  {
    id: "checkin",
    icon: Heart,
    title: "Simple check-in",
    message: "Hey brother, just checking in. How are you doing today?",
  },
  {
    id: "struggling",
    icon: Shield,
    title: "Facing a hard moment",
    message: "Hey, I'm having a tough moment. Would appreciate your prayers.",
  },
  {
    id: "victory",
    icon: Heart,
    title: "Sharing a win",
    message: "Had a moment of temptation but made it through. Grateful for you.",
  },
  {
    id: "prayer",
    icon: MessageCircle,
    title: "Prayer request",
    message: "Could use some prayer today. Feeling the weight of things.",
  },
];

interface ReachOutProps {
  onClose: () => void;
  onSent?: (target: ChatTarget) => void;
}

const ReachOut = ({ onClose, onSent }: ReachOutProps) => {
  const { user } = useAuth();
  const { brothers, isLoading } = useBrothers();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedBrothers, setSelectedBrothers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const currentMessage = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate)?.message || ""
    : "";

  const toggleBrother = (userId: string) => {
    setSelectedBrothers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = useCallback(async () => {
    if (!user || selectedBrothers.length === 0 || !currentMessage) return;
    setSending(true);

    try {
      let sentCount = 0;
      let lastDmTarget: ChatTarget | null = null;

      for (const brotherId of selectedBrothers) {
        const brother = brothers.find(b => b.userId === brotherId);
        const brotherName = brother?.displayName || "Brother";

        const { data: existing } = await supabase
          .from("chat_dms")
          .select("id")
          .or(
            `and(user_a.eq.${user.id},user_b.eq.${brotherId}),and(user_a.eq.${brotherId},user_b.eq.${user.id})`
          )
          .limit(1);

        let dmId: string;
        if (existing && existing.length > 0) {
          dmId = existing[0].id;
        } else {
          const [userA, userB] = [user.id, brotherId].sort();
          const { data: newDm, error } = await supabase
            .from("chat_dms")
            .insert({ user_a: userA, user_b: userB })
            .select("id")
            .single();
          if (error || !newDm) continue;
          dmId = newDm.id;
        }

        const { error: msgError } = await supabase.from("chat_messages").insert({
          content: currentMessage,
          user_id: user.id,
          dm_id: dmId,
        });

        if (!msgError) {
          sentCount++;
          lastDmTarget = { type: "dm", id: dmId, name: brotherName };
        }
      }

      if (sentCount > 0) {
        toast.success(
          sentCount === 1 ? "Message sent" : `Message sent to ${sentCount} brothers`,
          { description: "They'll see it in their messages." }
        );
        if (sentCount === 1 && lastDmTarget && onSent) {
          onSent(lastDmTarget);
        } else {
          onClose();
        }
      } else {
        toast.error("Could not send messages");
      }
    } catch (e: any) {
      toast.error("Could not send message", { description: e.message });
    } finally {
      setSending(false);
    }
  }, [user, selectedBrothers, currentMessage, brothers, onClose, onSent]);

  const canSend = selectedBrothers.length > 0 && !!currentMessage && !sending;

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", padding: "8px", marginLeft: "-8px", cursor: "pointer" }}
        >
          <X className="w-5 h-5" style={{ color: "rgba(26, 26, 26, 0.5)" }} />
        </button>
        <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "18px" }}>Reach Out</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Brothers — multi-select */}
        <div className="mb-6">
          <p style={{ fontFamily: systemSans, fontSize: "15px", fontWeight: 400, marginBottom: "12px" }}>
            Who do you want to reach?{" "}
            <span style={{ color: "rgba(26, 26, 26, 0.45)" }}>(select one or more)</span>
          </p>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : brothers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No brothers connected yet. Add brothers from the Brotherhood page first.
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {brothers.map((brother) => {
                const selected = selectedBrothers.includes(brother.userId);
                return (
                  <button
                    key={brother.userId}
                    onClick={() => toggleBrother(brother.userId)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      borderRadius: "12px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {selected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "hsl(var(--primary))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check className="w-3 h-3" style={{ color: "#1A1A1A" }} />
                      </div>
                    )}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#1A1A1A",
                        color: "#F5F3EE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 500,
                        fontFamily: systemSans,
                        border: selected ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      {brother.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontFamily: systemSans,
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      {brother.displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="mb-6">
          <p
            style={{
              fontFamily: systemSans,
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(26, 26, 26, 0.5)",
              marginBottom: "12px",
            }}
          >
            Choose a message template
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {templates.map((template) => {
              const isSelected = selectedTemplate === template.id;
              return (
                <motion.button
                  key={template.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    borderRadius: isSelected ? "0 12px 12px 0" : "12px",
                    background: isSelected ? "rgba(184, 150, 63, 0.1)" : "#1A1A1A",
                    border: "none",
                    borderLeft: isSelected ? "3px solid hsl(var(--primary))" : "3px solid transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div className="flex items-center gap-3" style={{ overflow: "hidden" }}>
                    <template.icon className="w-5 h-5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "15px", color: "#F5F3EE", marginBottom: "2px" }}>
                        {template.title}
                      </p>
                      <p
                        style={{
                          fontFamily: systemSans,
                          fontWeight: 400,
                          fontSize: "13px",
                          color: "rgba(245, 243, 238, 0.5)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {template.message}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {currentMessage && (
          <div className="mb-6">
            <p
              style={{
                fontFamily: systemSans,
                fontSize: "13px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "rgba(26, 26, 26, 0.5)",
                marginBottom: "12px",
              }}
            >
              Message preview
            </p>
            <div style={{ background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontFamily: systemSans, fontSize: "14px", color: "#F5F3EE" }}>{currentMessage}</p>
            </div>
          </div>
        )}

        {/* Safe reminder */}
        <div className="safe-zone">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Safe sharing:</strong> You don't need to share
            explicit details. Brothers understand. Connection is what matters.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-border">
        <Button
          variant="brotherhood"
          size="lg"
          onClick={handleSend}
          disabled={!canSend}
          className="w-full"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending
            ? "Sending…"
            : selectedBrothers.length > 1
              ? `Send to ${selectedBrothers.length} Brothers`
              : "Send Message"}
        </Button>
      </div>
    </div>
  );
};

export default ReachOut;