import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAnnouncements, useSaveAnnouncement } from "@/hooks/useAdminCurriculum";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <header>
          <Eyebrow className="mb-1 block">Announcements</Eyebrow>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
            Speak to the camp
          </h1>
          <p className="mt-1 text-sm text-dim">Publish updates for the brothers.</p>
        </header>
        <Button onClick={() => setEditDialog({ title: "", body: "", scope: "global", status: "draft" })} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !(announcements || []).length ? (
        <SectionCard className="p-12 text-center">
          <LkMonogram className="mx-auto mb-3 h-10 w-14 opacity-70" />
          <p className="text-sm text-dim">No announcements yet. Write the first one to reach the camp.</p>
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {announcements!.map((a) => (
            <SectionCard
              key={a.id}
              className="cursor-pointer p-4 transition-colors hover:bg-raised-2"
              onClick={() => setEditDialog(a)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold tracking-tight text-bone">{a.title}</h3>
                    <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-dim">{a.body.slice(0, 80)}</p>
                </div>
                <span className="shrink-0 text-xs text-dim">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editDialog?.id ? "Edit announcement" : "New announcement"}</DialogTitle></DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div><Label htmlFor="announcement-title">Title</Label><Input id="announcement-title" value={editDialog.title} onChange={(e) => setEditDialog({ ...editDialog, title: e.target.value })} /></div>
              <div><Label htmlFor="announcement-body">Body</Label><Textarea id="announcement-body" value={editDialog.body} onChange={(e) => setEditDialog({ ...editDialog, body: e.target.value })} rows={5} /></div>
              <div><Label>Status</Label>
                <div className="mt-1 flex gap-2">
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
    </div>
  );
};

export default AdminAnnouncements;
