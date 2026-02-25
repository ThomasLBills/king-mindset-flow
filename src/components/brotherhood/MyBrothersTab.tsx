import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, UserPlus, X, Check, Search, Loader2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrothers, useSearchUsers } from "@/hooks/useBrotherhood";
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

interface MyBrothersTabProps {
  onStartDM: (brotherUserId: string, name: string) => void;
}

const MyBrothersTab = ({ onStartDM }: MyBrothersTabProps) => {
  const {
    brothers, pendingRequests, maxBrothers, isLoading, atCapacity,
    sendRequest, acceptRequest, declineRequest, removeBrother,
  } = useBrothers();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(searchQuery);
  const [removeTarget, setRemoveTarget] = useState<{ connectionId: string; name: string } | null>(null);

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

  const existingIds = new Set([...brothers.map(b => b.userId), ...pendingRequests.map(b => b.userId)]);

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="font-serif text-lg font-semibold mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.connectionId} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-primary/20">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm">
                  {req.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{req.displayName}</p>
                  <p className="text-xs text-muted-foreground">Wants to connect</p>
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
          <h2 className="font-serif text-xl font-semibold">
            My Brothers <span className="text-sm text-muted-foreground font-normal">({brothers.length}/{maxBrothers})</span>
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSearch(!showSearch)}
            disabled={atCapacity}
          >
            <UserPlus className="w-4 h-4" />
            {atCapacity ? "Full" : "Add"}
          </Button>
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
          <div className="space-y-3">
            {brothers.map((brother) => (
              <div key={brother.connectionId} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-semibold">
                  {brother.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{brother.displayName}</p>
                </div>
                <button
                  onClick={() => onStartDM(brother.userId, brother.displayName)}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  aria-label={`Message ${brother.displayName}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRemoveTarget({ connectionId: brother.connectionId, name: brother.displayName })}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${brother.displayName}`}
                >
                  <UserMinus className="w-4 h-4" />
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
