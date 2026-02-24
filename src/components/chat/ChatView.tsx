import { Hash, MessageCircle } from "lucide-react";
import { useMessages, useJoinChannel, type ChatTarget } from "@/hooks/useChat";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { useEffect, useCallback } from "react";

interface ChatViewProps {
  target: ChatTarget | null;
}

const ChatView = ({ target }: ChatViewProps) => {
  const { messages, loading, sendMessage } = useMessages(target);
  const joinChannel = useJoinChannel();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    }
  }, [toast]);

  // Auto-join channel on selection
  useEffect(() => {
    if (target?.type === "channel") {
      joinChannel(target.id);
    }
  }, [target?.id, target?.type, joinChannel]);

  if (!target) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 px-6">
        <MessageCircle className="w-10 h-10 opacity-40" />
        <p className="text-center text-sm">Select a channel or conversation to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Channel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        {target.type === "channel" ? (
          <Hash className="w-5 h-5 text-muted-foreground" />
        ) : (
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
        )}
        <h3 className="font-serif text-lg font-semibold">{target.name}</h3>
      </div>

      <MessageList messages={messages} loading={loading} isAdmin={isAdmin} onDeleteMessage={handleDeleteMessage} />
      <MessageComposer
        onSend={sendMessage}
        placeholder={`Message ${target.type === "channel" ? "#" : ""}${target.name}`}
      />
    </div>
  );
};

export default ChatView;
