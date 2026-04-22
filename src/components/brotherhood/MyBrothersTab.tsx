import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, UserPlus, X, Check, Search, Loader2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrothers, useSearchUsers } from "@/hooks/useBrotherhood";
import { useUnread } from "@/contexts/UnreadContext";
import { useDMs } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import NotificationBadge from "@/components/ui/notification-badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

interface MyBrothersTabProps {
  onStartDM: (brotherUserId: string, name: string) => void;
}

const MyBrothersTab = ({ onStartDM }: MyBrothersTabProps) => {
  const { user } = useAuth();
  const {
    brothers, pendingRequests, outgoingPendingIds, declinedIds, maxBrothers, isLoading, atCapacity,
    sendRequest, acceptRequest, declineRequest, removeBrother,
  } = useBrothers();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(searchQuery);
  const [removeTarget, setRemoveTarget] = useState<{ connectionId: string; name: string } | null>(null);
  const { counts } = useUnread();
  const { dms } = useDMs();

  // Build a map: brother userId → dm id (for unread lookup)
  const brotherDmMap = new Map<string, string>();
  dms.forEach((dm) => {
    const otherUserId = dm.user_a === user?.id ? dm.user_b : dm.user_a;
    brotherDmMap.set(otherUserId, dm.id);
  });

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest.mutateAsync(userId);
      toast.success("Request sent!");
      setShowSearch(false);
      setSearchQuery("");
    } catch {
      toast.error("Could not send request. You may already have a connection.");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeBrother.mutateAsync(removeTarget.connectionId);
      toast.success(`${removeTarget.name} removed from your brothers`);
    } catch {
      toast.error("Could not remove brother");
    } finally {
      setRemoveTarget(null);
    }
  };

  const existingIds = new Set([
    ...brothers.map(b => b.userId),
    ...pendingRequests.map(b => b.userId),
    ...outgoingPendingIds,
    ...declinedIds,
  ]);

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2
            style={{
              fontFamily: systemSans,
              fontWeight: 600,
              fontSize: "16px",
              color: "hsl(var(--foreground))",
              marginBottom: "12px",
            }}
          >
            Pending Requests
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pendingRequests.map((req) => (
              <div
                key={req.connectionId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)",
                  border: "none",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#242424",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(245, 243, 238, 0.6)",
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: systemSans,
                  }}
                >
                  {req.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: systemSans, fontWeight: 500, fontSize: "15px", color: "#F5F3EE" }}>{req.displayName}</p>
                  <p style={{ fontFamily: systemSans, fontSize: "13px", color: "rgba(245, 243, 238, 0.5)" }}>Wants to connect</p>
                </div>
                <Button size="sm" variant="default" onClick={() => acceptRequest.mutate(req.connectionId)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => declineRequest.mutate(req.connectionId)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* My Brothers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontFamily: systemSans,
              fontWeight: 600,
              fontSize: "16px",
              color: "hsl(var(--foreground))",
            }}
          >
            My Brothers{" "}
            <span style={{ fontSize: "14px", fontWeight: 400, color: "rgba(26, 26, 26, 0.5)" }}>
              ({brothers.length}/{maxBrothers})
            </span>
          </h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            disabled={atCapacity}
            style={{
              fontFamily: systemSans,
              fontWeight: 500,
              fontSize: "13px",
              color: "hsl(var(--primary))",
              background: "none",
              border: "none",
              cursor: atCapacity ? "not-allowed" : "pointer",
              opacity: atCapacity ? 0.5 : 1,
              padding: 0,
            }}
          >
            {atCapacity ? "Full" : "Add"}
          </button>
        </div>

        {/* Search to add brothers */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden">
                  {searching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                  ) : (
                    searchResults.filter(u => !existingIds.has(u.user_id)).map((u) => (
                      <button
                        key={u.user_id}
                        onClick={() => handleSendRequest(u.user_id)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                          {(u.display_name || u.first_name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{u.display_name || u.first_name || "User"}</span>
                        <UserPlus className="w-4 h-4 ml-auto text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : brothers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>No brothers yet. Search and send a request to connect.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {brothers.map((brother) => (
              <div
                key={brother.connectionId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)",
                  border: "none",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "#242424",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(245, 243, 238, 0.6)",
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: systemSans,
                    flexShrink: 0,
                  }}
                >
                  {brother.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: systemSans, fontWeight: 500, fontSize: "15px", color: "#F5F3EE" }}>
                    {brother.displayName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onStartDM(brother.userId, brother.displayName)}
                  className="relative z-10"
                  aria-label={`Message ${brother.displayName}`}
                  style={{ background: "none", border: "none", padding: "8px", cursor: "pointer" }}
                >
                  <MessageCircle className="w-5 h-5" style={{ color: "rgba(245, 243, 238, 0.3)" }} />
                  {brotherDmMap.has(brother.userId) && (
                    <NotificationBadge count={counts.byConversation[brotherDmMap.get(brother.userId)!] || 0} dot />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveTarget({ connectionId: brother.connectionId, name: brother.displayName })}
                  aria-label={`Remove ${brother.displayName}`}
                  style={{ background: "none", border: "none", padding: "8px", cursor: "pointer" }}
                >
                  <UserMinus className="w-5 h-5" style={{ color: "rgba(245, 243, 238, 0.3)" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Brother</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeTarget?.name} from your brothers? This will remove the connection for both of you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyBrothersTab;