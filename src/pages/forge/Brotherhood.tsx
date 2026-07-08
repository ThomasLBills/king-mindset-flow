import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Hash, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/features";
import { useMockAuth } from "@/mock/auth";
import {
  useChannels,
  useDms,
  useGroup,
  useMarkThreadRead,
  useMessages,
  useSendMessage,
} from "@/mock/hooks";
import { GROUND_RULES, WEEKLY_CALL } from "@/mock/fixtures";
import type { Brother } from "@/mock/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eyebrow, InitialsAvatar, SectionCard } from "@/components/forge/atoms";

const statusMeta: Record<Brother["status"], { className: string; label: string }> = {
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
  threadId,
  title,
  readOnly = false,
  onBack,
}: {
  threadId: string;
  title: string;
  readOnly?: boolean;
  onBack: () => void;
}) => {
  const { user } = useMockAuth();
  const { data: messages } = useMessages(threadId);
  const sendMessage = useSendMessage();
  const markRead = useMarkThreadRead();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead.mutate(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user) return;
    setDraft("");
    sendMessage.mutate({ threadId, body, author: { name: user.name, initials: user.initials } });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <button onClick={onBack} className="text-dim transition-colors hover:text-bone md:hidden" aria-label="Back to list">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-bone">{title}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ul className="flex flex-col gap-4">
          {(messages ?? []).map((m) => (
            <li key={m.id} className={cn("flex gap-2.5", m.own && "flex-row-reverse")}>
              <InitialsAvatar
                initials={m.authorInitials}
                tone={m.own ? "gold" : "raised"}
                className="h-7 w-7 text-[11px]"
              />
              <div className={cn("max-w-[80%]", m.own && "text-right")}>
                <p className="mb-0.5 text-[11px] text-dim">
                  {m.own ? "You" : m.authorName} · {when(m.sentAtISO)}
                </p>
                <p
                  className={cn(
                    "inline-block rounded-lg border px-3.5 py-2.5 text-left text-sm leading-relaxed",
                    m.own ? "border-gold-deep/60 bg-raised-2 text-bone" : "border-line bg-raised text-bone-2"
                  )}
                >
                  {m.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div ref={endRef} />
      </div>
      {readOnly ? (
        <p className="border-t border-line p-3 text-center text-xs text-dim">
          This channel is view only.
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
          <label htmlFor="composer" className="sr-only">
            Message {title}
          </label>
          <Input
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Speak plainly, brother…"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || sendMessage.isPending} aria-label="Send">
            <SendHorizonal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      )}
    </div>
  );
};

const GroupTab = ({ openDm }: { openDm: (brotherId: string) => void }) => {
  const { user } = useMockAuth();
  const { data: group } = useGroup();
  const members = group?.members ?? [];
  return (
    <div className="flex flex-col gap-4">
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

      <SectionCard hatch className="p-5">
        <Eyebrow className="mb-1 block">Next brotherhood call</Eyebrow>
        <p className="font-display text-2xl font-bold tracking-tight text-bone">{WEEKLY_CALL.label}</p>
        <p className="mt-1 text-sm text-bone-2">
          Cameras on, guards down. One hour that holds the whole week together.
        </p>
        <Button
          className="mt-4"
          onClick={() => toast.info("The room opens Tuesday at 6:00 PM Central.")}
        >
          Join the call
        </Button>
      </SectionCard>

      {FEATURES.groups && group && (
        <SectionCard className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>{group.name}</Eyebrow>
            <span className="text-xs text-dim">{members.length} brothers</span>
          </div>
          <ul className="flex flex-col">
            {members.map((m, i) => {
              const self = m.initials === user?.initials;
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
                    <Button variant="outline" size="sm" onClick={() => openDm(m.id)}>
                      Message
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            className="mt-3 text-xs text-dim underline-offset-4 transition-colors hover:text-gold hover:underline"
            onClick={() =>
              toast.info("Request sent to the shepherds. They'll follow up within a day.")
            }
          >
            Request a change or add a brother
          </button>
        </SectionCard>
      )}
    </div>
  );
};

const Brotherhood = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "group";
  const thread = params.get("thread");
  const { data: channels } = useChannels();
  const { data: dms } = useDms();

  const setTab = (next: string) => setParams({ tab: next }, { replace: true });
  const setThread = (next: string | null) => {
    const p = new URLSearchParams({ tab });
    if (next) p.set("thread", next);
    setParams(p, { replace: true });
  };

  const openDm = (brotherId: string) => {
    const dm = dms?.find((t) => t.brotherId === brotherId);
    if (dm) setParams({ tab: "messages", thread: dm.id }, { replace: true });
  };

  const activeChannel = channels?.find((c) => c.id === thread);
  const activeDm = dms?.find((t) => t.id === thread);
  const activeTitle = activeChannel ? `# ${activeChannel.name}` : activeDm?.name ?? "";

  const list =
    tab === "channels" ? (
      <ul className="flex flex-col gap-1.5">
        {(channels ?? []).map((c) => (
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
                <span className="block text-sm font-semibold text-bone">{c.name}</span>
                <span className="block truncate text-xs text-dim">{c.description}</span>
              </span>
              {c.unread > 0 && (
                <Badge className="bg-gold text-primary-foreground hover:bg-gold">{c.unread}</Badge>
              )}
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <ul className="flex flex-col gap-1.5">
        {(dms ?? []).map((t) => (
          <li key={t.id}>
            <button
              onClick={() => setThread(t.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                thread === t.id
                  ? "border-gold-deep bg-raised-2"
                  : "border-line bg-raised hover:border-gold-deep/50"
              )}
            >
              <InitialsAvatar initials={t.initials} tone="raised" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-bone">{t.name}</span>
                  <span className="shrink-0 text-[11px] text-dim">{when(t.lastAtISO)}</span>
                </span>
                <span className="block truncate text-xs text-dim">{t.lastMessage}</span>
              </span>
              {t.unread > 0 && (
                <Badge className="bg-gold text-primary-foreground hover:bg-gold">{t.unread}</Badge>
              )}
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
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
        <div className="flex h-[62vh] min-h-[420px] gap-4">
          <div className={cn("w-full md:w-80 md:shrink-0", thread && "hidden md:block")}>{list}</div>
          <SectionCard className={cn("min-w-0 flex-1", !thread && "hidden md:block")}>
            {thread && (activeChannel || activeDm) ? (
              <ChatThread
                threadId={thread}
                title={activeTitle}
                readOnly={activeChannel?.readOnly}
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
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default Brotherhood;
