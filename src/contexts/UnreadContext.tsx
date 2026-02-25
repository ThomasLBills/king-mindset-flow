import { createContext, useContext, type ReactNode } from "react";
import { useUnreadCounts, type UnreadCounts } from "@/hooks/useUnreadCounts";

interface UnreadContextValue {
  counts: UnreadCounts;
  markAsRead: (conversationId: string, type: "channel" | "dm") => Promise<void>;
  refetch: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextValue>({
  counts: { byConversation: {}, total: 0 },
  markAsRead: async () => {},
  refetch: async () => {},
});

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { counts, markAsRead, refetch } = useUnreadCounts();
  return (
    <UnreadContext.Provider value={{ counts, markAsRead, refetch }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
