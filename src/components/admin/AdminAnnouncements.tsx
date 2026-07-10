import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAnnouncements, useSaveAnnouncement } from "@/hooks/useAdminCurriculum";
import { Eyebrow } from "@/components/forge/atoms";
import { AdminList, type AdminColumn } from "@/components/admin/AdminList";

type Announcement = {
  id: string;
  title: string;
  body: string;
  scope: string;
  status: string;
  created_at: string;
  published_at: string | null;
};

const dateOf = (a: Announcement) => a.published_at ?? a.created_at;
const formatDate = (a: Announcement) => new Date(dateOf(a)).toLocaleDateString();

const AdminAnnouncements = () => {
  const { data: announcements, isLoading, isError, refetch } = useAnnouncements();
  const saveAnnouncement = useSaveAnnouncement();
  const [editDialog, setEditDialog] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSave = async () => {
    if (!editDialog.title || !editDialog.body) return;
    const toSave = { ...editDialog };
    if (toSave.status === "published" && !toSave.published_at) toSave.published_at = new Date().toISOString();
    try {
      await saveAnnouncement.mutateAsync(toSave);
      setEditDialog(null);
    } catch {
      // Failure surfaces via the global mutation-error net; keep the dialog open to retry.
    }
  };

  // Announcements are few, so filter/search client-side over the created_at-desc
  // list the query already returns (no server pagination).
  const rows = useMemo<Announcement[]>(() => {
    const list = (announcements ?? []) as Announcement[];
    const q = search.trim().toLowerCase();
    return list.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (!q || a.title.toLowerCase().includes(q)),
    );
  }, [announcements, search, statusFilter]);

  const columns: AdminColumn<Announcement>[] = [
    {
      id: "title",
      header: "Title",
      primary: true,
      truncate: true,
      csv: (a) => a.title,
      cell: (a) => <span className="font-display text-sm font-bold tracking-tight text-bone">{a.title}</span>,
    },
    {
      id: "scope",
      header: "Scope",
      csv: (a) => a.scope,
      cell: (a) => <Badge variant="outline" className="capitalize">{a.scope}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      csv: (a) => a.status,
      cell: (a) => <Badge variant={a.status === "published" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>,
    },
    {
      id: "date",
      header: "Date",
      csv: (a) => formatDate(a),
      cell: (a) => <span className="whitespace-nowrap text-sm text-dim tabular-nums">{formatDate(a)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow className="mb-1 block">Announcements</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Speak to the camp
        </h1>
        <p className="mt-1 text-sm text-dim">Publish updates for the brothers.</p>
      </header>

      <AdminList<Announcement>
        caption="Member announcements"
        noun="announcements"
        columns={columns}
        rows={rows}
        getRowId={(a) => a.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title..."
        csvFilename="announcements"
        emptyTitle="No announcements yet"
        emptyHint="Write the first one to reach the camp."
        filters={
          <div className="w-full sm:w-40">
            <Label htmlFor="announcement-status" className="sr-only">Filter by status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="announcement-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        toolbarActions={
          <Button onClick={() => setEditDialog({ title: "", body: "", scope: "global", status: "draft" })} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" /> New
          </Button>
        }
        rowActions={(a) => (
          <Button size="sm" variant="outline" onClick={() => setEditDialog(a)}>Edit</Button>
        )}
      />

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
            <Button onClick={handleSave} disabled={saveAnnouncement.isPending}>
              {saveAnnouncement.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
