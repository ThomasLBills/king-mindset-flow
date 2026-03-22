import { useState, useRef, KeyboardEvent } from "react";
import { Send, SmilePlus, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EMOJI_LIST = ["😀", "😂", "😍", "🤔", "👍", "👏", "🔥", "💪", "🙏", "❤️", "💯", "🎉", "😎", "🤝", "✅", "⭐"];

interface MessageComposerProps {
  onSend: (content: string, imageUrl?: string) => Promise<void>;
  placeholder?: string;
}

const MessageComposer = ({ onSend, placeholder = "Type a message…" }: MessageComposerProps) => {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    await onSend(trimmed);
    setValue("");
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    const ext = file.name.split(".").pop();
    const path = `chat/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("chat-files").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
    await onSend(`📎 Shared an image`, urlData.publicUrl);
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
        disabled={uploading}
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
        disabled={!value.trim() || sending}
        className="shrink-0 rounded-xl"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MessageComposer;
