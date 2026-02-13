import { Hash, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChannels, useDMs, type ChatTarget } from "@/hooks/useChat";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface ChannelSidebarProps {
  active: ChatTarget | null;
  onSelect: (target: ChatTarget) => void;
}

const ChannelSidebar = ({ active, onSelect }: ChannelSidebarProps) => {
  const { channels } = useChannels();
  const { dms } = useDMs();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  return (
    <div className="w-full h-full bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-serif text-lg font-semibold">Community</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Channels */}
        <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground w-full">
            <ChevronDown className={cn("w-3 h-3 transition-transform", !channelsOpen && "-rotate-90")} />
            Channels
          </CollapsibleTrigger>
          <CollapsibleContent>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSelect({ type: "channel", id: ch.id, name: ch.name })}
                className={cn(
                  "flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors",
                  active?.id === ch.id
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Hash className="w-4 h-4 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* DMs */}
        {dms.length > 0 && (
          <Collapsible open={dmsOpen} onOpenChange={setDmsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 px-4 py-2 mt-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground w-full">
              <ChevronDown className={cn("w-3 h-3 transition-transform", !dmsOpen && "-rotate-90")} />
              Direct Messages
            </CollapsibleTrigger>
            <CollapsibleContent>
              {dms.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => onSelect({ type: "dm", id: dm.id, name: dm.otherName })}
                  className={cn(
                    "flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors",
                    active?.id === dm.id
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{dm.otherName}</span>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

export default ChannelSidebar;
