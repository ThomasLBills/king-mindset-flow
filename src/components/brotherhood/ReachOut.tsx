import { useState, type ReactNode } from "react";
import { Heart, Loader2, MessageCircle, SendHorizonal, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBrothers } from "@/hooks/useBrotherhood";
import { initialsOf } from "@/hooks/useForgeProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eyebrow, InitialsAvatar } from "@/components/forge/atoms";

/**
 * "Reach Out" crisis-outreach flow (parity with the original ReachOut.tsx).
 * Pick a canned template + one or more connected brothers, fire a real chat DM
 * to each via the find-or-create conversation path (chat_dms + chat_messages),
 * same as useChat's openDm / useForgeGroup.sendDm.
 */
const TEMPLATES = [
  {
    id: "checkin",
    icon: Heart,
    title: "Simple check-in",
    body: "Hey brother, just checking in. How are you doing today?",
  },
  {
    id: "struggling",
    icon: Shield,
    title: "Facing a hard moment",
    body: "Hey, I'm having a tough moment. Would appreciate your prayers.",
  },
  {
    id: "victory",
    icon: Sparkles,
    title: "Sharing a win",
    body: "Had a moment of temptation but made it through. Grateful for you.",
  },
  {
    id: "prayer",
    icon: MessageCircle,
    title: "Prayer request",
    body: "Could use some prayer today. Feeling the weight of things.",
  },
] as const;

export const ReachOut = ({ trigger }: { trigger: ReactNode }) => {
  const { user } = useAuth();
  const { brothers, isLoading } = useBrothers();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? null;

  const reset = () => {
    setTemplateId(null);
    setSelected([]);
    setSending(false);
  };

  const toggleBrother = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  const send = async () => {
    if (!user || !template || selected.length === 0 || sending) return;
    setSending(true);
    try {
      let sent = 0;
      for (const brotherId of selected) {
        // Find-or-create the DM before inserting, so we never duplicate a
        // conversation the other brother may have opened first.
        const { data: existing } = await supabase
          .from("chat_dms")
          .select("id")
          .or(
            `and(user_a.eq.${user.id},user_b.eq.${brotherId}),and(user_a.eq.${brotherId},user_b.eq.${user.id})`
          )
          .limit(1);
        let dmId = existing?.[0]?.id;
        if (!dmId) {
          const [userA, userB] = [user.id, brotherId].sort();
          const { data: created, error } = await supabase
            .from("chat_dms")
            .insert({ user_a: userA, user_b: userB })
            .select("id")
            .single();
          if (error || !created) continue;
          dmId = created.id;
        }
        const { error: msgError } = await supabase
          .from("chat_messages")
          .insert({ content: template.body, user_id: user.id, dm_id: dmId });
        if (!msgError) sent += 1;
      }

      if (sent > 0) {
        toast.success(sent === 1 ? "Message sent." : `Sent to ${sent} brothers.`, {
          description: "They'll see it in their messages.",
        });
        setOpen(false);
        reset();
      } else {
        toast.error("Couldn't send that. Try again in a moment.");
      }
    } finally {
      setSending(false);
    }
  };

  const canSend = !!template && selected.length > 0 && !sending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 border-line bg-raised p-0 text-bone">
        <DialogHeader className="border-b border-line px-5 py-4 text-left">
          <DialogTitle className="font-display text-lg font-bold uppercase tracking-[0.08em] text-bone">
            Reach Out
          </DialogTitle>
          <DialogDescription className="text-sm text-dim">
            Safe sharing — you don't need to share explicit details.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {/* Brothers — multi-select */}
          <Eyebrow className="mb-3 block">
            Who do you want to reach?{" "}
            <span className="font-normal normal-case tracking-normal text-dim">(select one or more)</span>
          </Eyebrow>
          {isLoading ? (
            <p className="py-4 text-sm text-dim">Loading your brothers…</p>
          ) : brothers.length === 0 ? (
            <p className="rounded-md border border-line bg-raised-2 px-4 py-4 text-sm text-bone-2">
              No brothers connected yet. Add brothers from the Brotherhood page first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brothers.map((b) => {
                const isOn = selected.includes(b.userId);
                return (
                  <button
                    key={b.userId}
                    type="button"
                    onClick={() => toggleBrother(b.userId)}
                    aria-pressed={isOn}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors",
                      isOn
                        ? "border-gold-deep bg-raised-2 text-bone"
                        : "border-line bg-raised text-bone-2 hover:border-gold-deep/50"
                    )}
                  >
                    <InitialsAvatar
                      initials={initialsOf(b.displayName)}
                      tone={isOn ? "gold" : "raised"}
                      className="h-6 w-6 text-[10px]"
                    />
                    <span className="max-w-[10rem] truncate">{b.displayName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Templates */}
          <Eyebrow className="mb-3 mt-6 block">Choose a message</Eyebrow>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => {
              const isOn = t.id === templateId;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  aria-pressed={isOn}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors",
                    isOn
                      ? "border-gold-deep bg-raised-2"
                      : "border-line bg-raised hover:border-gold-deep/50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 shrink-0", isOn ? "text-gold" : "text-dim")} aria-hidden="true" />
                    <span className="text-sm font-semibold text-bone">{t.title}</span>
                  </span>
                  <span className="text-xs leading-relaxed text-dim [overflow-wrap:anywhere]">{t.body}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <Button className="w-full" disabled={!canSend} onClick={send}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizonal className="h-4 w-4" aria-hidden="true" />
            )}
            {selected.length > 1 ? `Send to ${selected.length} brothers` : "Send message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReachOut;
