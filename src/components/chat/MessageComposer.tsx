import { useState, useRef, KeyboardEvent } from "react";
import { Send, SmilePlus, ImagePlus, Loader2, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImpersonation, useIsImpersonating } from "@/contexts/ImpersonationContext";

const EMOJI_LIST = ["😀", "😂", "😍", "🤔", "👍", "👏", "🔥", "💪", "🙏", "❤️", "💯", "🎉", "😎", "🤝", "✅", "⭐"];

interface MessageComposerProps {
  onSend: (content: string, imageUrl?: string) => Promise<void>;
  placeholder?: string;
}

const MessageComposer = ({ onSend, placeholder = "Type a message…" }: MessageComposerProps) => {
  const isMobile = useIsMobile();
  const isImpersonating = useIsImpersonating();
  const { target: impersonationTarget, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (isImpersonating) {
    const name =
      impersonationTarget?.display_name ||
      impersonationTarget?.first_name ||
      impersonationTarget?.email ||
      "user";
    return (
      <div
        className="border-t border-border p-3 flex items-center justify-between gap-3 bg-card shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="text-sm truncate">
            Read only - impersonating{" "}
            <strong className="text-foreground">{name}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await stopImpersonation();
            navigate("/admin/users");
          }}
          className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground uppercase tracking-wide transition hover:bg-destructive/90 shrink-0"
        >
          <X className="h-3.5 w-3.5" /> Exit
        </button>
      </div>
    );
  }

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
        textareaRef.current.focus();
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      toast({ title: "Send failed", description: err?.message || "Could not send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, Enter always creates a new line; only the send button sends.
    // On desktop, Enter sends and Shift+Enter creates a new line.
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      toast({ title: "Upload failed", description: "You must be signed in", variant: "destructive" });
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${userData.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("chat-files").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
    try {
      await onSend("", urlData.publicUrl);
    } catch (err: any) {
      console.error("Failed to send image:", err);
      toast({ title: "Send failed", description: err?.message || "Could not send image", variant: "destructive" });
    }
    setUploading(false);
  };

  const insertEmoji = (emoji: string) => {
    setValue(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border p-4 flex items-end gap-2 bg-card shrink-0">
      {/* Image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-xl"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || isImpersonating}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
      </Button>

      {/* Emoji picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
            <SmilePlus className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-auto p-2 bg-card border-border z-50">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-lg p-1 rounded hover:bg-secondary hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>


      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // Auto-grow textarea
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-secondary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground min-h-[44px] max-h-[120px]"
        style={{ height: "44px", overflow: "auto" }}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!value.trim() || sending || isImpersonating}
        title={isImpersonating ? "Disabled during impersonation" : undefined}
        className="shrink-0 rounded-xl"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MessageComposer;
