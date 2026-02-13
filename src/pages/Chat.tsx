import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ChannelSidebar from "@/components/chat/ChannelSidebar";
import ChatView from "@/components/chat/ChatView";
import type { ChatTarget } from "@/hooks/useChat";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatPage = () => {
  const [target, setTarget] = useState<ChatTarget | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSelect = (t: ChatTarget) => {
    setTarget(t);
    setSidebarOpen(false);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-60px-80px)] overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-60 shrink-0">
            <ChannelSidebar active={target} onSelect={handleSelect} />
          </div>
        )}

        {/* Mobile sidebar via sheet */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button className="absolute top-[72px] left-3 z-30 p-2 rounded-lg bg-card border border-border">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <ChannelSidebar active={target} onSelect={handleSelect} />
            </SheetContent>
          </Sheet>
        )}

        {/* Chat area */}
        <ChatView target={target} />
      </div>
    </AppLayout>
  );
};

export default ChatPage;
