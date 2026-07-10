import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Eye, Hash, ImagePlus, Loader2, Lock, MessageCircle, MessagesSquare, Pin, SendHorizonal, SmilePlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { ErrorState, EmptyState, LoadingState } from "@/components/feedback";
import { FEATURES } from "@/features";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  useChannels,
  useDMs,
  useJoinChannel,
  useMessages,
  type ChatTarget,
} from "@/hooks/useChat";
import { useChatReactions } from "@/hooks/useChatReactions";
import { useUnread } from "@/contexts/UnreadContext";
import { useImpersonation, useIsImpersonating } from "@/contexts/ImpersonationContext";
import { useGroup, type BrotherStatus } from "@/hooks/useForgeGroup";
import { initialsOf } from "@/hooks/useForgeProfile";
import { WEEKLY_CALL, isCallDay } from "@/data/weeklyCall";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eyebrow, InitialsAvatar, SectionCard } from "@/components/forge/atoms";
import { PageBackdrop } from "@/components/forge/scenes";
import { ReachOut } from "@/components/brotherhood/ReachOut";
import { MessageBody } from "@/components/chat/MessageBody";

/** Fixed product copy from production (BrotherhoodPage ground rules). */
const GROUND_RULES = [
  "Connection matters more than details",
  "Restore with grace, not condemnation",
  "What's spoken here stays here",
];

/** Same quick-reaction set the original chat's MessageList offers. */
const QUICK_EMOJIS = ["❤️", "👍", "🙏", "🔥", "💪", "😂", "👏", "💯"];

const statusMeta: Record<BrotherStatus, { className: string; label: string }> = {
  steady: { className: "bg-gold", label: "Steady" },
  struggling: { className: "bg-ember", label: "In the fight" },
  away: { className: "bg-line", label: "Away" },
};

const when = (iso: string) => {
  const d = new Date(iso);
  return Date.now() - d.getTime() < 86_400_000
    ? formatDistanceToNow(d, { addSuffix: true })
    : format(d, "MMM d");
};

/** Message list + composer, shared by channels and DMs. */
const ChatThread = ({
  target,
  title,
  locked = false,
  onBack,
}: {
  target: ChatTarget;
  title: string;
  locked?: boolean;
  onBack: () => void;
}) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  // Locked channels are admin-only to post (RLS enforces this too); everyone
  // can post in unlocked channels and DMs.
  const canPost = !locked || isAdmin;
  const isImpersonating = useIsImpersonating();
  const { target: impersonationTarget } = useImpersonation();
  const { markAsRead } = useUnread();
  const joinChannel = useJoinChannel();

  // Channels: join first (mirrors the original Chat page), then load messages.
  const [channelReady, setChannelReady] = useState(false);
  useEffect(() => {
    setChannelReady(false);
    if (target.type === "channel") {
      joinChannel(target.id).then(() => setChannelReady(true));
    }
  }, [target.id, target.type, joinChannel]);
  const ready = target.type === "dm" ? true : channelReady;

  const { messages, loading, error, sendMessage, refetch } = useMessages(target, ready);
  const { reactions, toggleReaction } = useChatReactions(messages.map((m) => m.id));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    markAsRead(target.id, target.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id, target.type]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Private chat-files bucket: swap stored URLs for signed ones (same as MessageList).
  // Only sign images not already signed - the messages array changes identity on
  // every realtime insert, and re-signing all of them each time is wasted work.
  useEffect(() => {
    const withImages = messages.filter(
      (m) => m.image_url?.includes("chat-files") && !signedUrls[m.id]
    );
    if (!withImages.length) return;
    let cancelled = false;
    Promise.all(
      withImages.map(async (m) => {
        const match = m.image_url!.match(/chat-files\/(.+)$/);
        if (!match) return null;
        const { data } = await supabase.storage.from("chat-files").createSignedUrl(match[1], 3600);
        return data?.signedUrl ? ([m.id, data.signedUrl] as const) : null;
      })
    ).then((entries) => {
      if (cancelled) return;
      const next = Object.fromEntries(entries.filter(Boolean) as (readonly [string, string])[]);
      if (Object.keys(next).length) setSignedUrls((prev) => ({ ...prev, ...next }));
    });
    return () => {
      cancelled = true;
    };
  }, [messages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending || !canPost) return;
    setSending(true);
    try {
      await sendMessage(body);
      // No success toast: the message appearing in the thread is the confirmation.
      setDraft("");
    } catch (err) {
      // sendMessage isn't a useMutation, so the global net doesn't cover it.
      notify.fromError(err);
    } finally {
      setSending(false);
    }
  };

  // Attachment upload: same user-scoped path + private chat-files bucket as the
  // original MessageComposer (ADR 0006). Store the URL on the message; the
  // signing effect above swaps it for a short-lived signed URL when rendering.
  const handleUpload = async (file: File) => {
    if (uploading || sending || !canPost) return;
    // Validate type + size inline BEFORE uploading, so we never round-trip a
    // file we already know we'll reject.
    if (!file.type.startsWith("image/")) {
      notify.error("That file isn't an image. Please choose an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify.error("That file is too large. Max 10MB.");
      return;
    }
    setUploading(true);
    try {
      if (!user) throw new Error("You must be signed in to attach a file.");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
      // No success toast: the image appearing in the thread is the confirmation.
      await sendMessage("", urlData.publicUrl);
    } catch (err) {
      notify.fromError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        {/* after:-inset-2 pads the hit target to ≥24px without changing the rendered icon. */}
        <button onClick={onBack} className="relative text-dim transition-colors after:absolute after:-inset-2 hover:text-bone md:hidden" aria-label="Back to list">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-bone">{title}</span>
      </div>
      {/* role=log is an implicit polite live region - appended messages get announced. */}
      <div role="log" aria-label="Messages" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading && messages.length === 0 ? (
          <LoadingState lines={4} className="px-2" />
        ) : error ? (
          <ErrorState
            message="We couldn't load these messages."
            onRetry={() => refetch()}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Speak first — two honest lines can turn a whole day."
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m) => {
              const own = m.user_id === user?.id;
              const authorName = m.profile?.display_name || m.profile?.first_name || "Brother";
              const msgReactions = reactions[m.id] ?? [];
              return (
                <li key={m.id} className={cn("flex gap-2.5", own && "flex-row-reverse")}>
                  <InitialsAvatar
                    initials={initialsOf(authorName)}
                    tone={own ? "gold" : "raised"}
                    className="h-7 w-7 text-[11px]"
                  />
                  <div className={cn("min-w-0 max-w-[80%]", own && "text-right")}>
                    <p className="mb-0.5 text-[11px] text-dim">
                      {own ? "You" : authorName} · {when(m.created_at)}
                    </p>
                    {m.content && <MessageBody content={m.content} own={own} />}
                    {m.image_url && (
                      <img
                        src={signedUrls[m.id] || m.image_url}
                        alt="Shared attachment"
                        loading="lazy"
                        className="mt-1.5 inline-block max-w-full rounded-lg border border-line"
                      />
                    )}
                    {(msgReactions.length > 0 || !isImpersonating) && (
                      <div className={cn("mt-1.5 flex flex-wrap items-center gap-1", own && "justify-end")}>
                        {msgReactions.map((r) => (
                          <button
                            key={r.emoji}
                            onClick={() => !isImpersonating && toggleReaction(m.id, r.emoji)}
                            disabled={isImpersonating}
                            className={cn(
                              // after:-inset-y-0.5 grows the ~22px pill's hit target to ≥24px invisibly.
                              "relative inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors after:absolute after:inset-x-0 after:-inset-y-0.5",
                              r.reacted
                                ? "border-gold-deep/60 bg-raised-2 text-gold"
                                : "border-line bg-raised text-bone-2 hover:border-gold-deep/50"
                            )}
                          >
                            <span>{r.emoji}</span>
                            <span>{r.count}</span>
                          </button>
                        ))}
                        {!isImpersonating && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line bg-raised text-dim transition-colors hover:border-gold-deep/50 hover:text-bone"
                                aria-label="Add reaction"
                              >
                                <SmilePlus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" className="w-auto border-line bg-raised p-1.5">
                              <div className="flex gap-0.5">
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(m.id, emoji)}
                                    className="grid h-8 w-8 place-items-center rounded-md text-lg transition-transform hover:scale-110"
                                    aria-label={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={endRef} />
      </div>
      {isImpersonating ? (
        <div className="flex items-center justify-center gap-2 border-t border-line p-3 text-xs text-dim">
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Read only - viewing as{" "}
            <strong className="font-semibold text-bone">
              {impersonationTarget?.display_name ||
                impersonationTarget?.first_name ||
                impersonationTarget?.email}
            </strong>
          </span>
        </div>
      ) : (
        // Composer is always shown. When the channel is locked and the viewer
        // isn't an admin it renders disabled with a lock hint, so flipping the
        // channel's lock makes it live with no code change.
        <form
          onSubmit={submit}
          className={cn("flex items-center gap-2 border-t border-line p-3", !canPost && "opacity-70")}
        >
          <label htmlFor="composer" className="sr-only">
            Message {title}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          {canPost ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-dim hover:text-bone"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              aria-label="Attach image"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          ) : (
            <span
              className="grid h-9 w-9 shrink-0 place-items-center text-dim"
              title="Only admins can post in this channel"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <Input
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={canPost ? "Speak plainly, brother…" : "Only admins can post in this channel"}
            autoComplete="off"
            disabled={!canPost || uploading}
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={!canPost || !draft.trim() || sending || uploading}
            aria-label="Send"
          >
            <SendHorizonal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      )}
    </div>
  );
};

const GroupTab = ({ openDm }: { openDm: (brotherId: string, name: string) => void }) => {
  const { user } = useAuth();
  const { data: group, isLoading: groupLoading, isError: groupError, refetch: refetchGroup } = useGroup();
  const isImpersonating = useIsImpersonating();
  const members = group?.members ?? [];
  return (
    <div className="flex flex-col gap-4">
      <SectionCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow className="mb-1 block">Carry it together</Eyebrow>
            <p className="font-display text-lg font-bold text-bone">Reach out to a brother</p>
            <p className="mt-1 text-sm text-bone-2">
              A check-in, a hard moment, a win, or a prayer — send it in two taps.
            </p>
          </div>
          <ReachOut
            trigger={
              <Button className="shrink-0" disabled={isImpersonating}>
                Reach out
              </Button>
            }
          />
        </div>
      </SectionCard>

      <SectionCard className="p-5">
        <Eyebrow className="mb-3 block">Ground rules</Eyebrow>
        <ul className="flex flex-col gap-2">
          {GROUND_RULES.map((rule, i) => (
            <li key={rule} className="flex items-baseline gap-3 text-sm text-bone">
              <span className="font-display text-xs font-bold text-gold" aria-hidden="true">
                {["I", "II", "III"][i]}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Tuesdays only — same device-local gate as Today; no dead off-day button. */}
      {isCallDay() && (
        <SectionCard hatch className="p-5">
          <Eyebrow className="mb-1 block">Tonight's brotherhood call</Eyebrow>
          <p className="font-display text-2xl font-bold tracking-tight text-bone">{WEEKLY_CALL.label}</p>
          <p className="mt-1 text-sm text-bone-2">
            Cameras on, guards down. One hour that holds the whole week together.
          </p>
          <Button
            className="mt-4"
            onClick={() => window.open(WEEKLY_CALL.joinUrl, "_blank", "noopener,noreferrer")}
          >
            Join the call
          </Button>
        </SectionCard>
      )}

      {FEATURES.groups && groupLoading && (
        <SectionCard className="p-5">
          <LoadingState lines={4} />
        </SectionCard>
      )}

      {FEATURES.groups && !groupLoading && groupError && (
        <SectionCard className="p-5">
          <ErrorState
            message="We couldn't load your group."
            onRetry={() => refetchGroup()}
          />
        </SectionCard>
      )}

      {FEATURES.groups && !groupLoading && !groupError && !group && (
        <SectionCard className="p-5">
          <EmptyState
            icon={Users}
            title="No brothers yet"
            description="Once you're connected with brothers, your group shows up here."
          />
        </SectionCard>
      )}

      {FEATURES.groups && group && (
        <SectionCard className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>{group.name}</Eyebrow>
            <span className="text-xs text-dim">{members.length} brothers</span>
          </div>
          <ul className="flex flex-col">
            {members.map((m, i) => {
              const self = m.id === user?.id;
              return (
                <li
                  key={m.id}
                  className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-line-soft")}
                >
                  <InitialsAvatar initials={m.initials} tone="raised" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-bone">
                      {m.name}
                      {self && <span className="ml-1.5 text-xs font-normal text-dim">(you)</span>}
                    </span>
                    {FEATURES.statusDots && (
                      <span className="flex items-center gap-1.5 text-xs text-dim">
                        <i className={cn("h-1.5 w-1.5 rounded-full", statusMeta[m.status].className)} aria-hidden="true" />
                        {statusMeta[m.status].label}
                      </span>
                    )}
                  </div>
                  {!self && (
                    <Button variant="outline" size="sm" onClick={() => openDm(m.id, m.name)}>
                      Message
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
};

const Brotherhood = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "group";
  const thread = params.get("thread");
  const { user } = useAuth();
  const {
    channels,
    loading: channelsLoading,
    error: channelsError,
    refetch: refetchChannels,
  } = useChannels();
  const { dms, loading: dmsLoading, error: dmsError, refetch: refetchDms } = useDMs();
  const { counts } = useUnread();
  // DMs opened from the group card that aren't in the fetched list yet.
  const [openedDms, setOpenedDms] = useState<Record<string, string>>({});

  const setTab = (next: string) => setParams({ tab: next }, { replace: true });
  const setThread = (next: string | null) => {
    const p = new URLSearchParams({ tab });
    if (next) p.set("thread", next);
    setParams(p, { replace: true });
  };

  const openDm = async (brotherId: string, name: string) => {
    if (!user) return;
    const cached = dms.find((d) => d.user_a === brotherId || d.user_b === brotherId);
    if (cached) {
      setParams({ tab: "messages", thread: cached.id }, { replace: true });
      return;
    }
    // Find-or-create, same as the original Brotherhood page. The DM may exist
    // without being in our fetched list (created in another tab / by the other
    // brother first), so check the table before inserting a duplicate.
    const { data: existing } = await supabase
      .from("chat_dms")
      .select("id")
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${brotherId}),and(user_a.eq.${brotherId},user_b.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();
    let dmId = existing?.id;
    if (!dmId) {
      const [userA, userB] = [user.id, brotherId].sort();
      const { data: created, error } = await supabase
        .from("chat_dms")
        .insert({ user_a: userA, user_b: userB })
        .select("id")
        .single();
      if (error || !created) {
        notify.fromError(error, "Couldn't open that conversation. Try again in a moment.");
        return;
      }
      dmId = created.id;
    }
    setOpenedDms((prev) => ({ ...prev, [dmId!]: name }));
    setParams({ tab: "messages", thread: dmId! }, { replace: true });
  };

  const activeChannel = channels.find((c) => c.id === thread);
  const activeDm = dms.find((d) => d.id === thread);
  const target: ChatTarget | null = activeChannel
    ? { type: "channel", id: activeChannel.id, name: activeChannel.name }
    : activeDm
      ? { type: "dm", id: activeDm.id, name: activeDm.otherName }
      : thread && openedDms[thread]
        ? { type: "dm", id: thread, name: openedDms[thread] }
        : null;
  const activeTitle = target ? (target.type === "channel" ? `# ${target.name}` : target.name) : "";

  const channelsBody = channelsLoading ? (
    <LoadingState lines={5} />
  ) : channelsError ? (
    <ErrorState message="We couldn't load the channels." onRetry={() => refetchChannels()} />
  ) : channels.length === 0 ? (
    <EmptyState
      icon={Hash}
      title="No channels yet"
      description="Channels appear here once your brotherhood sets them up."
    />
  ) : (
    <ul className="flex flex-col gap-1.5">
      {channels.map((c) => {
        const unread = counts.byConversation[c.id] ?? 0;
        return (
          <li key={c.id}>
            <button
              onClick={() => setThread(c.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                thread === c.id
                  ? "border-gold-deep bg-raised-2"
                  : "border-line bg-raised hover:border-gold-deep/50"
              )}
            >
              <Hash className="h-4 w-4 shrink-0 text-dim" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-bone">{c.name}</span>
                  {c.is_pinned && (
                    <Pin className="h-3 w-3 shrink-0 text-gold" role="img" aria-label="Pinned" />
                  )}
                  {c.is_locked && (
                    <Lock className="h-3 w-3 shrink-0 text-dim" role="img" aria-label="Locked" />
                  )}
                </span>
                {c.description && (
                  <span className="block truncate text-xs text-dim">{c.description}</span>
                )}
              </span>
              {unread > 0 && (
                <Badge className="bg-gold text-primary-foreground hover:bg-gold">{unread}</Badge>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const dmsBody = dmsLoading ? (
    <LoadingState lines={5} />
  ) : dmsError ? (
    <ErrorState message="We couldn't load your messages." onRetry={() => refetchDms()} />
  ) : dms.length === 0 ? (
    <EmptyState
      icon={MessagesSquare}
      title="No conversations yet"
      description="Reach a brother from My group to start a conversation."
      action={
        <Button variant="outline" size="sm" onClick={() => setTab("group")}>
          Go to My group
        </Button>
      }
    />
  ) : (
    <ul className="flex flex-col gap-1.5">
      {dms.map((d) => {
        const unread = counts.byConversation[d.id] ?? 0;
        return (
          <li key={d.id}>
            <button
              onClick={() => setThread(d.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                thread === d.id
                  ? "border-gold-deep bg-raised-2"
                  : "border-line bg-raised hover:border-gold-deep/50"
              )}
            >
              <InitialsAvatar initials={initialsOf(d.otherName)} tone="raised" />
              <span className="min-w-0 flex-1 text-sm font-semibold text-bone">{d.otherName}</span>
              {unread > 0 && (
                <Badge className="bg-gold text-primary-foreground hover:bg-gold">{unread}</Badge>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const list = tab === "channels" ? channelsBody : dmsBody;
  // Chat tabs get a wider desktop canvas (the narrow reading column left the
  // thread cramped); the group tab stays reading-width.
  const isChat = tab === "channels" || tab === "messages";

  return (
    <PageBackdrop className={cn("mx-auto px-5 py-7 sm:px-8", isChat ? "max-w-6xl" : "max-w-3xl")}>
      <header className="mb-5">
        <Eyebrow className="mb-1 block">Never fight alone</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Brotherhood
        </h1>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="group">My group</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "group" && <GroupTab openDm={openDm} />}

      {(tab === "channels" || tab === "messages") && (
        // Fill the viewport minus chrome so the composer is always in view and
        // only the message list scrolls. Two chrome budgets: mobile/tablet have
        // the top bar + bottom tab bar (up to lg); lg+ has the desktop rail only.
        // ponytail: the rem constants are tuned to the current header/nav heights —
        // adjust them if that chrome changes.
        <div className="flex h-[calc(100dvh-17rem)] min-h-[420px] gap-4 lg:h-[calc(100dvh-12rem)]">
          <div
            className={cn(
              "w-full overflow-y-auto md:w-80 md:shrink-0",
              thread && "hidden md:block"
            )}
          >
            {list}
          </div>
          {/* A plain flex container, not SectionCard: SectionCard's inner wrapper
              isn't full-height, so ChatThread's h-full collapsed and its overflow
              clipped the composer. */}
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-raised",
              !thread && "hidden md:flex"
            )}
          >
            {target ? (
              <ChatThread
                target={target}
                title={activeTitle}
                locked={activeChannel?.is_locked ?? false}
                onBack={() => setThread(null)}
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <p className="max-w-[260px] text-sm text-dim">
                  {tab === "channels"
                    ? "Pick a channel and see what the brothers are carrying this week."
                    : "Pick a brother. Two honest lines can turn a whole day."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageBackdrop>
  );
};

export default Brotherhood;
