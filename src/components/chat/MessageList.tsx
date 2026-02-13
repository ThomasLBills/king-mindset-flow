import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { format } from "date-fns";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
}

const MessageList = ({ messages, loading }: MessageListProps) => {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading messages…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => {
        const isOwn = msg.user_id === user?.id;
        const displayName = msg.profile?.display_name || msg.profile?.first_name || "User";
        const initials = displayName.slice(0, 2).toUpperCase();
        return (
          <div key={msg.id} className="flex items-start gap-3 group">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-sm font-semibold", isOwn && "text-primary")}>
                  {isOwn ? "You" : displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), "h:mm a")}
                </span>
              </div>
              <p className="text-sm mt-0.5 break-words">{msg.content}</p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
