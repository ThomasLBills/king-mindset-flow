import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { format } from "date-fns";
import { useChatReactions } from "@/hooks/useChatReactions";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const QUICK_EMOJIS = ["❤️", "👍", "🙏", "🔥", "💪", "😂", "👏", "💯"];

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
}

const MessageList = ({ messages, loading }: MessageListProps) => {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageIds = messages.map(m => m.id);
  const { reactions, toggleReaction } = useChatReactions(messageIds);

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
        const msgReactions = reactions[msg.id] || [];

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
                {/* Reaction trigger */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-secondary">
                      <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-auto p-2 bg-card border-border z-50">
                    <div className="flex gap-1">
                      {QUICK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-secondary"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-sm mt-0.5 break-words">{msg.content}</p>
              {/* Image attachment */}
              {(msg as any).image_url && (
                <img src={(msg as any).image_url} alt="attachment" className="mt-2 max-w-xs rounded-lg border border-border" />
              )}
              {/* Reactions display */}
              {msgReactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {msgReactions.map(r => (
                    <button
                      key={r.emoji}
                      onClick={() => toggleReaction(msg.id, r.emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                        r.reacted
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
