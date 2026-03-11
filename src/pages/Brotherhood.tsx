import { useState, useCallback } from "react";
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

const BrotherhoodPage = () => {
  const { user } = useAuth();
  const { markAsRead } = useUnread();
  const [showReachOut, setShowReachOut] = useState(false);
  const [activeTab, setActiveTab] = useState("brothers");
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
      <div className="px-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="font-serif text-3xl font-bold mb-1">Brotherhood</h1>
          <p className="text-muted-foreground text-sm">Freedom is sustained together</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <div className="rounded-xl bg-card border border-primary p-4">
            <div className="mb-2">
              <span className="font-medium">BROTHERHOOD GROUND RULES:</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Connection matters more than details</li>
              <li>• Restore with grace, not condemnation</li>
              <li>• What's spoken here stays here</li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5">
          
          <button
            onClick={() => setShowReachOut(true)}
            className="w-full text-left p-4 rounded-2xl bg-[#111111] border-l-4 border-primary transition-all hover:border-primary/80">
            
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 bg-[#0A0A0A] border border-primary/30 p-1">
            <TabsTrigger value="brothers" className="flex-1 gap-1.5 text-white/50 data-[state=active]:bg-primary data-[state=active]:text-[#0A0A0A] data-[state=active]:shadow-none font-semibold">
              <Users className="w-4 h-4" /> Brothers
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex-1 gap-1.5 text-white/50 data-[state=active]:bg-primary data-[state=active]:text-[#0A0A0A] data-[state=active]:shadow-none font-semibold">
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
  const { messages, loading, sendMessage } = useMessages(target);
  const joinChannel = useJoinChannel();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const { channels } = useChannels();

  const ch = channels.find((c) => c.id === target.id);
  const isLocked = (ch as any)?.is_locked;

  // Auto-join
  useState(() => {joinChannel(target.id);});

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
        <h3 className="font-serif text-lg font-semibold">{target.name}</h3>
        {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
      </div>
      <MessageList messages={messages} loading={loading} isAdmin={isAdmin} onDeleteMessage={handleDeleteMessage} />
      {!isLocked || isAdmin ?
      <MessageComposer onSend={sendMessage} placeholder="Message…" /> :

      <div className="p-3 text-center text-sm text-muted-foreground border-t border-border bg-card shrink-0">
          This channel is view only.
        </div>
      }
    </div>);

};

export default BrotherhoodPage;