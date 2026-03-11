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

const ChannelsTab = () => {
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
    setActiveChannel(target);
    joinChannel(ch.id);
    markAsRead(ch.id, "channel");
  };

  if (activeChannel) {
    const ch = channels.find(c => c.id === activeChannel.id);
    const isLocked = (ch as any)?.is_locked;

    return (
      <div className="flex flex-col h-[calc(100vh-160px)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button onClick={() => setActiveChannel(null)} className="text-sm text-primary font-medium">
            ← Back
          </button>
          <Hash className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-serif text-lg font-semibold">{activeChannel.name}</h3>
          {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <MessageList messages={messages} loading={loading} isAdmin={isAdmin} onDeleteMessage={handleDeleteMessage} />
        {!isLocked ? (
          <MessageComposer onSend={sendMessage} placeholder="Message…" />
        ) : isAdmin ? (
          <MessageComposer onSend={sendMessage} placeholder="Message…" />
        ) : (
          <div className="p-3 text-center text-sm text-muted-foreground border-t border-border bg-card">
            This channel is view only.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <h2 className="font-serif text-xl font-semibold mb-4">Channels</h2>
      <div className="space-y-2">
        {sorted.map((ch, i) => (
          <motion.button
            key={ch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSelect(ch)}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
          >
            <div className="relative shrink-0">
              <Hash className="w-5 h-5 text-muted-foreground" />
              <NotificationBadge count={counts.byConversation[ch.id] || 0} dot />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{ch.name}</span>
                {(ch as any).is_pinned && <Pin className="w-3 h-3 text-accent" />}
                {(ch as any).is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
              {ch.description && (
                <p className="text-sm text-muted-foreground truncate">{ch.description}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChannelsTab;
