import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Loader2 } from "lucide-react";
import { useDMs, useMessages, type ChatTarget } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";

interface MessagesTabProps {
  initialTarget?: ChatTarget | null;
}

const MessagesTab = ({ initialTarget }: MessagesTabProps) => {
  const { dms, loading: dmsLoading } = useDMs();
  const [activeTarget, setActiveTarget] = useState<ChatTarget | null>(initialTarget ?? null);
  const { messages, loading, sendMessage } = useMessages(activeTarget);

  if (activeTarget) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button onClick={() => setActiveTarget(null)} className="text-sm text-primary font-medium">
            ← Back
          </button>
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-serif text-lg font-semibold">{activeTarget.name}</h3>
        </div>
        <MessageList messages={messages} loading={loading} />
        <MessageComposer onSend={sendMessage} placeholder={`Message ${activeTarget.name}`} />
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <h2 className="font-serif text-xl font-semibold mb-4">Messages</h2>
      {dmsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : dms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p>No conversations yet.</p>
          <p className="mt-1">Go to My Brothers and tap the message icon to start a DM.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dms.map((dm, i) => (
            <motion.button
              key={dm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveTarget({ type: "dm", id: dm.id, name: dm.otherName })}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm">
                {dm.otherName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="font-medium">{dm.otherName}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesTab;
