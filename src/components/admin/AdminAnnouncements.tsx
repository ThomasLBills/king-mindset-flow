import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Megaphone } from "lucide-react";
import { useAnnouncements, useSaveAnnouncement } from "@/hooks/useAdminCurriculum";
import { motion } from "framer-motion";

const AdminAnnouncements = () => {
  const { data: announcements, isLoading } = useAnnouncements();
  const saveAnnouncement = useSaveAnnouncement();
  const [editDialog, setEditDialog] = useState<any>(null);

  const handleSave = async () => {
    if (!editDialog.title || !editDialog.body) return;
    const toSave = { ...editDialog };
    if (toSave.status === "published" && !toSave.published_at) toSave.published_at = new Date().toISOString();
    await saveAnnouncement.mutateAsync(toSave);
    setEditDialog(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Publish updates for your users</p>
        </div>
        <Button onClick={() => setEditDialog({ title: "", body: "", scope: "global", status: "draft" })} className="gap-2">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !(announcements || []).length ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No announcements yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements!.map((a) => (
            <Card key={a.id} className="card-elevated cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => setEditDialog(a)}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-serif font-semibold truncate">{a.title}</h3><Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status}</Badge></div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{a.body.slice(0, 80)}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{editDialog?.id ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editDialog.title} onChange={(e) => setEditDialog({ ...editDialog, title: e.target.value })} /></div>
              <div><Label>Body</Label><Textarea value={editDialog.body} onChange={(e) => setEditDialog({ ...editDialog, body: e.target.value })} rows={5} /></div>
              <div><Label>Status</Label>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant={editDialog.status === "draft" ? "default" : "outline"} onClick={() => setEditDialog({ ...editDialog, status: "draft" })}>Draft</Button>
                  <Button size="sm" variant={editDialog.status === "published" ? "default" : "outline"} onClick={() => setEditDialog({ ...editDialog, status: "published" })}>Published</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveAnnouncement.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminAnnouncements;
