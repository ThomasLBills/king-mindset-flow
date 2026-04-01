import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { format } from "date-fns";
import { useChatReactions } from "@/hooks/useChatReactions";
import { SmilePlus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

const QUICK_EMOJIS = ["❤️", "👍", "🙏", "🔥", "💪", "😂", "👏", "💯"];

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  isAdmin?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  channelName?: string;
}

const MessageList = ({ messages, loading, isAdmin, onDeleteMessage, channelName }: MessageListProps) => {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageIds = messages.map(m => m.id);
  const { reactions, toggleReaction } = useChatReactions(messageIds);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Generate signed URLs for chat-files images
  useEffect(() => {
    const imageMessages = messages.filter((m: any) => m.image_url?.includes("chat-files"));
    if (!imageMessages.length) return;

    const fetchSignedUrls = async () => {
      const newUrls: Record<string, string> = {};
      await Promise.all(
        imageMessages.map(async (msg: any) => {
          const url = msg.image_url as string;
          // Extract path after /object/public/chat-files/ or /object/sign/chat-files/
          const match = url.match(/chat-files\/(.+)$/);
          if (!match) return;
          const { data } = await supabase.storage.from("chat-files").createSignedUrl(match[1], 3600);
          if (data?.signedUrl) newUrls[msg.id] = data.signedUrl;
        })
      );
      setSignedUrls(prev => ({ ...prev, ...newUrls }));
    };
    fetchSignedUrls();
  }, [messages]);

  // Stable scroll-to-bottom helper using bottomRef for reliability
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: "end" });
    }
  }, []);

  // Scroll to bottom whenever messages change (load or new message)
  useEffect(() => {
    if (loading || messages.length === 0) return;

    // Immediate
    scrollToBottom();

    // rAF to catch post-paint layout
    const raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });

    // Staggered fallbacks for async content (images, embeds)
    const t1 = setTimeout(scrollToBottom, 100);
    const t2 = setTimeout(scrollToBottom, 300);
    const t3 = setTimeout(scrollToBottom, 600);
    const t4 = setTimeout(scrollToBottom, 1200);

    // MutationObserver for dynamic DOM changes
    const el = containerRef.current;
    let observer: MutationObserver | undefined;
    if (el) {
      observer = new MutationObserver(scrollToBottom);
      observer.observe(el, { childList: true, subtree: true, attributes: true });
    }

    // Listen for image loads within the container
    const images = el?.querySelectorAll("img") ?? [];
    const handleImageLoad = () => scrollToBottom();
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener("load", handleImageLoad);
      }
    });

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      observer?.disconnect();
      images.forEach(img => img.removeEventListener("load", handleImageLoad));
    };
  }, [messages.length, loading, scrollToBottom]);

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
    <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-2 space-y-4">
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
                  {channelName?.toLowerCase() !== "liberated sessions" && (
                    <>{format(new Date(msg.created_at), "EEE, MMM d")} · </>
                  )}
                  {format(new Date(msg.created_at), "h:mm a")}
                </span>
                {/* Reaction trigger - visible on mobile */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1 p-1.5 -m-1 rounded-lg active:bg-secondary touch-manipulation">
                      <SmilePlus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-auto p-2 bg-card border-border z-50 !animate-none !duration-0">
                    <div className="flex gap-0.5">
                      {QUICK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            toggleReaction(msg.id, emoji);
                          }}
                          className="text-xl min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg active:scale-110 active:bg-secondary transition-transform touch-manipulation"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Admin delete */}
                {isAdmin && onDeleteMessage && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-destructive/10"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </div>
              <p className="text-sm mt-0.5 break-words whitespace-pre-wrap">
                {msg.content.replace(/https?:\/\/(?:www\.)?vimeo\.com\/\d+(?:\/[a-f0-9]+)?(?:\?[^\s]*)?\s*/g, '').trim()}
              </p>
              {/* Vimeo embed */}
              {(() => {
                const vimeoMatch = msg.content.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
                if (!vimeoMatch) return null;
                const videoId = vimeoMatch[1];
                const hash = vimeoMatch[2];
                const embedSrc = `https://player.vimeo.com/video/${videoId}?dnt=1${hash ? `&h=${hash}` : ''}&playsinline=1&responsive=1`;
                return (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border w-full max-w-[480px]">
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={embedSrc}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                        allowFullScreen
                        {...{ webkitallowfullscreen: "", mozallowfullscreen: "" } as any}
                        title="Vimeo video"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })()}
              {/* Image attachment */}
              {(msg as any).image_url && (
                <ChatImage src={signedUrls[msg.id] || (msg as any).image_url} />
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
