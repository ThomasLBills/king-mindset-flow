import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Loader2, ArrowLeft } from "lucide-react";
import { useDMs, useMessages, type ChatTarget } from "@/hooks/useChat";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";

interface MessagesTabProps {
  initialTarget?: ChatTarget | null;
  onBack?: () => void;
}

const MessagesTab = ({ initialTarget, onBack }: MessagesTabProps) => {
  const [activeTarget, setActiveTarget] = useState<ChatTarget | null>(initialTarget ?? null);
  const { messages, loading, sendMessage } = useMessages(activeTarget);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setActiveTarget(null);
    }
  };

  if (activeTarget) {
    return (
      <div className="fixed inset-x-0 flex flex-col bg-background z-40" style={{ top: 'calc(57px + env(safe-area-inset-top, 0px))', bottom: 'calc(65px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button onClick={handleBack} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-serif text-lg font-semibold">{activeTarget.name}</h3>
        </div>
        <MessageList messages={messages} loading={loading} />
        <MessageComposer onSend={sendMessage} placeholder="Message…" />
      </div>
    );
  }

  // Fallback DM list (not used in current flow but kept for safety)
  return (
    <div className="px-5 py-6">
      <h2 className="font-serif text-xl font-semibold mb-4">Messages</h2>
      <div className="text-center py-8 text-muted-foreground text-sm">
        <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p>No conversations yet.</p>
        <p className="mt-1">Go to My Brothers and tap the message icon to start a DM.</p>
      </div>
    </div>
  );
};

export default MessagesTab;
