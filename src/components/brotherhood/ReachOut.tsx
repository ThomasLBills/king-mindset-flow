import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Send, Heart, Shield, MessageCircle, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBrothers } from "@/hooks/useBrotherhood";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const ReachOut = ({ onClose }: ReachOutProps) => {
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

      for (const brotherId of selectedBrothers) {
        // Find or create DM
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
          const { data: newDm, error } = await supabase
            .from("chat_dms")
            .insert({ user_a: user.id, user_b: brotherId })
            .select("id")
            .single();
          if (error || !newDm) continue;
          dmId = newDm.id;
        }

        // Send the message
        const { error: msgError } = await supabase.from("chat_messages").insert({
          content: currentMessage,
          user_id: user.id,
          dm_id: dmId,
        });

        if (!msgError) sentCount++;
      }

      if (sentCount > 0) {
        toast.success(
          sentCount === 1 ? "Message sent" : `Message sent to ${sentCount} brothers`,
          { description: "They'll see it in their messages." }
        );
        onClose();
      } else {
        toast.error("Could not send messages");
      }
    } catch (e: any) {
      toast.error("Could not send message", { description: e.message });
    } finally {
      setSending(false);
    }
  }, [user, selectedBrothers, currentMessage, onClose]);

  const canSend = selectedBrothers.length > 0 && !!currentMessage && !sending;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-semibold">Reach Out</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Brothers — multi-select */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">
            Who do you want to reach?{" "}
            <span className="text-muted-foreground font-normal">(select one or more)</span>
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
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold",
                        selected ? "bg-primary-foreground/20" : "bg-background"
                      )}
                    >
                      {brother.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{brother.displayName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Choose a message template</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <motion.button
                key={template.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  selectedTemplate === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      selectedTemplate === template.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    )}
                  >
                    <template.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{template.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {template.message}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {currentMessage && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">Message preview</p>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm">{currentMessage}</p>
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
      <div className="p-6 border-t border-border">
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
