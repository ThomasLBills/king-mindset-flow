import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Hash, Lock, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChannels, useMessages, useJoinChannel, type ChatTarget } from "@/hooks/useChat";
import { useUnread } from "@/contexts/UnreadContext";
import NotificationBadge from "@/components/ui/notification-badge";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

interface ChannelsTabProps {
  onSelectChannel?: (target: ChatTarget) => void;
}

const ChannelsTab = ({ onSelectChannel }: ChannelsTabProps) => {
  const { channels } = useChannels();
  const [activeChannel, setActiveChannel] = useState<ChatTarget | null>(null);
  const { messages, loading, sendMessage } = useMessages(activeChannel);
  const joinChannel = useJoinChannel();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const { counts, markAsRead } = useUnread();

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    }
  }, [toast]);

  // Sort: pinned first, then by sort_order
  const sorted = [...channels].sort((a, b) => {
    const ap = (a as any).is_pinned ? 1 : 0;
    const bp = (b as any).is_pinned ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return ((a as any).sort_order || 0) - ((b as any).sort_order || 0);
  });

  const handleSelect = (ch: typeof channels[0]) => {
    const target: ChatTarget = { type: "channel", id: ch.id, name: ch.name };
    joinChannel(ch.id);
    markAsRead(ch.id, "channel");
    if (onSelectChannel) {
      onSelectChannel(target);
    } else {
      setActiveChannel(target);
    }
  };

  if (activeChannel && !onSelectChannel) {
    const ch = channels.find(c => c.id === activeChannel.id);
    const isLocked = (ch as any)?.is_locked;

    return (
      <div className="fixed inset-x-0 flex flex-col bg-background z-40" style={{ top: '57px', bottom: 'calc(65px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <button onClick={() => setActiveChannel(null)} className="text-sm text-primary font-medium">
            ← Back
          </button>
          <Hash className="w-4 h-4 text-muted-foreground" />
          <h3 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "18px" }}>{activeChannel.name}</h3>
          {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <MessageList messages={messages} loading={loading} isAdmin={isAdmin} onDeleteMessage={handleDeleteMessage} channelName={activeChannel.name} />
        {!isLocked ? (
          <MessageComposer onSend={sendMessage} placeholder="Message…" />
        ) : isAdmin ? (
          <MessageComposer onSend={sendMessage} placeholder="Message…" />
        ) : (
          <div className="p-3 text-center text-sm text-muted-foreground border-t border-border bg-card shrink-0">
            This channel is view only.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: systemSans,
          fontWeight: 600,
          fontSize: "16px",
          color: "hsl(var(--foreground))",
          marginBottom: "16px",
        }}
      >
        Channels
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sorted.map((ch, i) => (
          <motion.button
            key={ch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSelect(ch)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div className="relative shrink-0">
              <Hash className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              <NotificationBadge count={counts.byConversation[ch.id] || 0} dot />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "15px", color: "#F5F3EE" }}>
                  {ch.name}
                </span>
                {(ch as any).is_pinned && <Pin className="w-3 h-3" style={{ color: "rgba(245, 243, 238, 0.3)" }} />}
                {(ch as any).is_locked && <Lock className="w-3 h-3" style={{ color: "rgba(245, 243, 238, 0.3)" }} />}
              </div>
              {ch.description && (
                <p style={{ fontFamily: systemSans, fontSize: "13px", color: "rgba(245, 243, 238, 0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ch.description}
                </p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChannelsTab;