import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
}

const MessageComposer = ({ onSend, placeholder = "Type a message…" }: MessageComposerProps) => {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="border-t border-border p-3 flex items-end gap-2 bg-card">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-secondary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground min-h-[40px] max-h-[120px]"
        style={{ height: "auto", overflow: "auto" }}
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
