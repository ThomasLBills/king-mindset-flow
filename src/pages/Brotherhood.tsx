import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Hash, Lock, Pin, MessageCircle, Loader2 } from "lucide-react";
import MyBrothersTab from "@/components/brotherhood/MyBrothersTab";
import ReachOut from "@/components/brotherhood/ReachOut";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChannels, useDMs, useMessages, useJoinChannel, type ChatTarget } from "@/hooks/useChat";

/* Combined Channels + DMs view */
interface CommunityChatProps {
  initialDmTarget?: ChatTarget | null;
}

const CommunityChat = ({ initialDmTarget }: CommunityChatProps) => {
  const { channels } = useChannels();
  const { dms, loading: dmsLoading } = useDMs();
  const joinChannel = useJoinChannel();
  const [activeTarget, setActiveTarget] = useState<ChatTarget | null>(initialDmTarget ?? null);
  const { messages, loading, sendMessage } = useMessages(activeTarget);

  const sorted = [...channels].sort((a, b) => {
    const ap = (a as any).is_pinned ? 1 : 0;
    const bp = (b as any).is_pinned ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return ((a as any).sort_order || 0) - ((b as any).sort_order || 0);
  });

  const handleSelectChannel = (ch: typeof channels[0]) => {
    setActiveTarget({ type: "channel", id: ch.id, name: ch.name });
    joinChannel(ch.id);
  };

  if (activeTarget) {
    const ch = activeTarget.type === "channel" ? channels.find(c => c.id === activeTarget.id) : null;
    const isLocked = (ch as any)?.is_locked;

    return (
      <div className="flex flex-col h-[calc(100vh-220px)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button onClick={() => setActiveTarget(null)} className="text-sm text-primary font-medium">
            ← Back
          </button>
          {activeTarget.type === "channel" ? (
            <Hash className="w-4 h-4 text-muted-foreground" />
          ) : (
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          )}
          <h3 className="font-serif text-lg font-semibold">{activeTarget.name}</h3>
          {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <MessageList messages={messages} loading={loading} />
        {isLocked ? (
          <div className="p-3 text-center text-sm text-muted-foreground border-t border-border bg-card">
            This channel is read-only
          </div>
        ) : (
          <MessageComposer
            onSend={sendMessage}
            placeholder={activeTarget.type === "channel" ? `Message #${activeTarget.name}` : `Message ${activeTarget.name}`}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 px-1">Channels</h3>
        <div className="space-y-2">
          {sorted.map((ch, i) => (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelectChannel(ch)}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{ch.name}</span>
                  {(ch as any).is_pinned && <Pin className="w-3 h-3 text-accent" />}
                  {(ch as any).is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                </div>
                {ch.description && (
                  <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                )}
              </div>
            </motion.button>
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No channels yet</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 px-1">Direct Messages</h3>
        {dmsLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : dms.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>No conversations yet.</p>
            <p className="mt-1 text-xs">Tap the message icon on a brother to start a DM.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dms.map((dm, i) => (
              <motion.button
                key={dm.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setActiveTarget({ type: "dm", id: dm.id, name: dm.otherName })}
                className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-semibold text-xs">
                  {dm.otherName.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium text-sm">{dm.otherName}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* Main Brotherhood Page */
const BrotherhoodPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("brothers");
  const [dmTarget, setDmTarget] = useState<ChatTarget | null>(null);

  const handleStartDM = useCallback(async (brotherUserId: string, name: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("chat_dms")
      .select("id")
      .or(`and(user_a.eq.${user.id},user_b.eq.${brotherUserId}),and(user_a.eq.${brotherUserId},user_b.eq.${user.id})`)
      .limit(1);

    let dmId: string;
    if (existing && existing.length > 0) {
      dmId = existing[0].id;
    } else {
      const { data: newDm, error } = await supabase
        .from("chat_dms")
        .insert({ user_a: user.id, user_b: brotherUserId })
        .select("id")
        .single();
      if (error || !newDm) return;
      dmId = newDm.id;
    }

    setDmTarget({ type: "dm", id: dmId, name });
    setActiveTab("chat");
  }, [user]);

  const [showReachOut, setShowReachOut] = useState(false);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="font-serif text-3xl font-bold mb-1">Brotherhood</h1>
          <p className="text-muted-foreground text-sm">Freedom is sustained together</p>
        </motion.div>

        {/* Reach Out Now */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <button
            onClick={() => setShowReachOut(true)}
            className="w-full text-left p-4 rounded-2xl bg-[#111111] border-l-4 border-primary transition-all hover:border-primary/80"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Reach Out Now</h3>
                <p className="text-sm text-white">Connect with a brother immediately</p>
              </div>
            </div>
          </button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "chat") setDmTarget(null); }}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="brothers" className="flex-1 gap-1.5">
              <Users className="w-4 h-4" />
              My Brothers
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brothers" className="mt-0">
            <MyBrothersTab onStartDM={handleStartDM} />
          </TabsContent>
          <TabsContent value="chat" className="mt-0">
            <CommunityChat initialDmTarget={dmTarget} />
          </TabsContent>
        </Tabs>
      </div>

      {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
    </AppLayout>
  );
};

export default BrotherhoodPage;
