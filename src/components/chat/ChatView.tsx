import { Hash, MessageCircle, Lock, Eye, X } from "lucide-react";
import { useMessages, useJoinChannel, useChannels, type ChatTarget } from "@/hooks/useChat";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useIsImpersonating, useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
import { ErrorState, useConfirm } from "@/components/feedback";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { useEffect, useCallback, useMemo, useState } from "react";

interface ChatViewProps {
  target: ChatTarget | null;
}

const ChatView = ({ target }: ChatViewProps) => {
  const [channelReady, setChannelReady] = useState(false);
  const joinChannel = useJoinChannel();
  const { channels } = useChannels();
  const { isAdmin } = useAdminRole();
  const confirm = useConfirm();
  const isImpersonating = useIsImpersonating();
  const { target: impersonationTarget, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  // For DMs, no join needed - ready immediately
  const isReady = target ? (target.type === "dm" ? true : channelReady) : false;

  const { messages, loading, error, sendMessage, refetch } = useMessages(target, isReady);

  const isLockedChannel = useMemo(() => {
    if (!target || target.type !== "channel") return false;
    const channel = channels.find(c => c.id === target.id);
    return channel?.is_locked === true;
  }, [target, channels]);

  const canPost = !isLockedChannel || isAdmin;

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const ok = await confirm({
      title: "Delete this message?",
      consequence: "It will be removed for everyone. This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    // On success the realtime DELETE subscription drops it from the list — that's
    // the confirmation, so no success toast.
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
    if (error) notify.fromError(error);
  }, [confirm]);

  // Join channel first, then mark ready
  useEffect(() => {
    setChannelReady(false);
    if (target?.type === "channel") {
      joinChannel(target.id).then(() => setChannelReady(true));
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

      {error && !loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-6">
          <ErrorState message="We couldn't load these messages." onRetry={() => refetch()} />
        </div>
      ) : (
        <MessageList messages={messages} loading={loading} isAdmin={isAdmin} onDeleteMessage={handleDeleteMessage} channelName={target.type === "channel" ? target.name : undefined} />
      )}
      {isImpersonating ? (
        <div className="border-t border-border p-4 flex items-center justify-between gap-3 bg-card shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-4 h-4 shrink-0" />
            <span className="text-sm">
              Read only - viewing as <strong className="text-foreground">{impersonationTarget?.display_name || impersonationTarget?.first_name || impersonationTarget?.email}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await stopImpersonation();
              navigate("/admin/users");
            }}
            className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground uppercase tracking-wide transition hover:bg-destructive/90"
          >
            <X className="h-3.5 w-3.5" /> Exit
          </button>
        </div>
      ) : canPost ? (
        <MessageComposer
          onSend={sendMessage}
          placeholder="Message…"
        />
      ) : (
        <div className="border-t border-border p-4 flex items-center justify-center gap-2 bg-card shrink-0 text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="text-sm">This channel is view only</span>
        </div>
      )}
    </div>
  );
};

export default ChatView;
