import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Users, Hash, Lock } from "lucide-react";
import MyBrothersTab from "@/components/brotherhood/MyBrothersTab";
import ChannelsTab from "@/components/brotherhood/ChannelsTab";
import ReachOut from "@/components/brotherhood/ReachOut";
import MessagesTab from "@/components/brotherhood/MessagesTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUnread } from "@/contexts/UnreadContext";
import { useMessages, useJoinChannel, type ChatTarget } from "@/hooks/useChat";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useToast } from "@/hooks/use-toast";
import { useChannels } from "@/hooks/useChat";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const BrotherhoodPage = () => {
  const { user } = useAuth();
  const { markAsRead } = useUnread();
  const [showReachOut, setShowReachOut] = useState(false);
  const [activeTab, setActiveTab] = useState("channels");
  const [dmTarget, setDmTarget] = useState<ChatTarget | null>(null);
  const [channelTarget, setChannelTarget] = useState<ChatTarget | null>(null);

  const handleStartDM = useCallback(async (brotherUserId: string, name: string) => {
    if (!user) return;

    const { data: existing } = await supabase.
    from("chat_dms").
    select("id").
    or(`and(user_a.eq.${user.id},user_b.eq.${brotherUserId}),and(user_a.eq.${brotherUserId},user_b.eq.${user.id})`).
    maybeSingle();

    let dmId: string;
    if (existing) {
      dmId = existing.id;
    } else {
      const [userA, userB] = [user.id, brotherUserId].sort();
      const { data: newDm, error } = await supabase.
      from("chat_dms").
      insert({ user_a: userA, user_b: userB }).
      select("id").
      single();
      if (error || !newDm) return;
      dmId = newDm.id;
    }

    setDmTarget({ type: "dm", id: dmId, name });
    markAsRead(dmId, "dm");
  }, [user, markAsRead]);

  const handleReachOutClose = useCallback(() => {
    setShowReachOut(false);
  }, []);

  const handleReachOutSent = useCallback((target: ChatTarget) => {
    setShowReachOut(false);
    setDmTarget(target);
  }, []);

  // If a DM conversation is active, show it full-screen within the layout
  if (dmTarget) {
    return (
      <AppLayout>
        <MessagesTab initialTarget={dmTarget} onBack={() => setDmTarget(null)} />
      </AppLayout>);
  }

  // If a channel is active, show full-screen chat replacing the landing page entirely
  if (channelTarget) {
    return (
      <AppLayout>
        <ChannelChatView
          target={channelTarget}
          onBack={() => setChannelTarget(null)} />
      </AppLayout>);
  }

  return (
    <AppLayout>
      <div className="px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1
            style={{
              fontFamily: systemSans,
              fontWeight: 600,
              fontSize: "26px",
              letterSpacing: "-0.02em",
              color: "hsl(var(--foreground))",
              marginBottom: "4px",
            }}
          >
            Brotherhood
          </h1>
          <p
            style={{
              fontFamily: systemSans,
              fontWeight: 400,
              fontSize: "15px",
              color: "rgba(26, 26, 26, 0.6)",
            }}
          >
            Freedom is sustained together
          </p>
        </motion.div>

        {/* Ground Rules */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <div
            style={{
              background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)",
              borderRadius: "16px",
              padding: "20px",
              border: "none",
            }}
          >
            <p
              style={{
                fontFamily: systemSans,
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "hsl(var(--primary))",
                marginBottom: "12px",
              }}
            >
              BROTHERHOOD GROUND RULES
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "Connection matters more than details",
                "Restore with grace, not condemnation",
                "What's spoken here stays here",
              ].map((rule, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "hsl(var(--primary))", flexShrink: 0, marginTop: "6px" }} />
                  <p style={{ fontFamily: systemSans, fontSize: "14px", fontWeight: 400, color: "#F5F3EE", lineHeight: 1.4 }}>
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Reach Out Now */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <button
            onClick={() => setShowReachOut(true)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "18px 20px",
              borderRadius: "16px",
              background: "hsl(var(--primary))",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(26, 26, 26, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users className="w-6 h-6" style={{ color: "#1A1A1A" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: systemSans,
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1A1A1A",
                    marginBottom: "2px",
                  }}
                >
                  Reach Out Now
                </h3>
                <p
                  style={{
                    fontFamily: systemSans,
                    fontWeight: 400,
                    fontSize: "13px",
                    color: "rgba(26, 26, 26, 0.6)",
                  }}
                >
                  Connect with a brother immediately
                </p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="w-full mb-4 p-[3px]"
            style={{
              background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <TabsTrigger
              value="brothers"
              className="flex-1 gap-1.5 data-[state=active]:shadow-none"
              style={{
                fontFamily: systemSans,
                fontSize: "14px",
                borderRadius: "10px",
                border: "none",
              }}
              data-state={activeTab === "brothers" ? "active" : "inactive"}
            >
              <Users className="w-4 h-4" /> Brothers
            </TabsTrigger>
            <TabsTrigger
              value="channels"
              className="flex-1 gap-1.5 data-[state=active]:shadow-none"
              style={{
                fontFamily: systemSans,
                fontSize: "14px",
                borderRadius: "10px",
                border: "none",
              }}
              data-state={activeTab === "channels" ? "active" : "inactive"}
            >
              <Hash className="w-4 h-4" /> Channels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brothers">
            <MyBrothersTab onStartDM={handleStartDM} />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelsTab onSelectChannel={setChannelTarget} />
          </TabsContent>
        </Tabs>
      </div>

      {showReachOut && <ReachOut onClose={handleReachOutClose} onSent={handleReachOutSent} />}
    </AppLayout>);
};

/** Full-screen channel chat view — completely replaces the Brotherhood landing page */
const ChannelChatView = ({ target, onBack }: {target: ChatTarget;onBack: () => void;}) => {
  const [channelReady, setChannelReady] = useState(false);
  const joinChannel = useJoinChannel();
  const { messages, loading, sendMessage } = useMessages(target, channelReady);
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const { channels } = useChannels();

  const ch = channels.find((c) => c.id === target.id);
  const isLocked = (ch as any)?.is_locked;

  // Auto-join, then mark ready so messages + realtime start
  useEffect(() => {
    setChannelReady(false);
    joinChannel(target.id).then(() => setChannelReady(true));
  }, [target.id, joinChannel]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    }
  }, [toast]);

  return (
    <div className="fixed inset-x-0 flex flex-col bg-background z-40" style={{ top: 'calc(57px + env(safe-area-inset-top, 0px))', bottom: 'calc(65px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button onClick={onBack} className="text-sm text-primary font-medium">
          ← Back
        </button>
        <Hash className="w-4 h-4 text-muted-foreground" />
        <h3 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "18px" }}>{target.name}</h3>
        {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
      </div>
      <MessageList messages={messages} loading={loading} isAdmin={isAdmin} onDeleteMessage={handleDeleteMessage} channelName={target.name} />
      {!isLocked || isAdmin ?
      <MessageComposer onSend={sendMessage} placeholder="Message…" /> :
      <div className="p-3 text-center text-sm text-muted-foreground border-t border-border bg-card shrink-0">
          This channel is view only.
        </div>
      }
    </div>);
};

export default BrotherhoodPage;