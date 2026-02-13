import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Hash, MessageCircle } from "lucide-react";
import MyBrothersTab from "@/components/brotherhood/MyBrothersTab";
import ChannelsTab from "@/components/brotherhood/ChannelsTab";
import MessagesTab from "@/components/brotherhood/MessagesTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ChatTarget } from "@/hooks/useChat";

const BrotherhoodPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("brothers");
  const [dmTarget, setDmTarget] = useState<ChatTarget | null>(null);

  const handleStartDM = useCallback(async (brotherUserId: string, name: string) => {
    if (!user) return;
    // Check for existing DM
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
    setActiveTab("messages");
  }, [user]);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="font-serif text-3xl font-bold mb-1">Brotherhood</h1>
          <p className="text-muted-foreground text-sm">Freedom is sustained together</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "messages") setDmTarget(null); }}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="brothers" className="flex-1 gap-1.5">
              <Users className="w-4 h-4" />
              Brothers
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex-1 gap-1.5">
              <Hash className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 gap-1.5">
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brothers" className="mt-0">
            <MyBrothersTab onStartDM={handleStartDM} />
          </TabsContent>
          <TabsContent value="channels" className="mt-0">
            <ChannelsTab />
          </TabsContent>
          <TabsContent value="messages" className="mt-0">
            <MessagesTab initialTarget={dmTarget} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default BrotherhoodPage;
