import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft, Plus, Pencil, Trash2, Loader2, Copy, Eye, EyeOff, Clock,
} from "lucide-react";
import {
  useWeek, useCurriculumLessons, useSaveCurriculumLesson,
  useDeleteCurriculumLesson, usePublishCurriculumLesson, useDuplicateCurriculumLesson,
} from "@/hooks/useAdminCurriculumNew";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";

const WeekDetail = () => {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const { data: week, isLoading: weekLoading } = useWeek(weekId);
  const { data: lessons, isLoading: lessonsLoading } = useCurriculumLessons(weekId);
  const saveLesson = useSaveCurriculumLesson();
  const deleteLesson = useDeleteCurriculumLesson();
  const publishLesson = usePublishCurriculumLesson();
  const duplicateLesson = useDuplicateCurriculumLesson();

  const [editDialog, setEditDialog] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editDialog?.title || !editDialog?.slug) return;
    await saveLesson.mutateAsync({ ...editDialog, week_id: weekId });
    setEditDialog(null);
  };

  const openNewLesson = () => {
    setEditDialog({
      title: "",
      slug: "",
      summary: "",
      duration_minutes: null,
      status: "draft",
      unlock_rule: "inherit",
      unlock_day_offset: null,
      order_index: lessons?.length || 0,
    });
  };

  if (weekLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to curriculum" onClick={() => navigate("/admin/curriculum")}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-0.5 block">Curriculum</Eyebrow>
          <h1 className="truncate font-display text-2xl font-bold uppercase tracking-wide text-bone">{week?.title}</h1>
          <p className="truncate text-sm text-dim">{week?.summary || "No summary"}</p>
        </div>
        <Badge className="capitalize">{week?.status}</Badge>
      </div>

      {/* Lessons Header */}
      <div className="flex items-center justify-between">
        <Eyebrow>Lessons ({lessons?.length || 0})</Eyebrow>
        <Button size="sm" onClick={openNewLesson} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add Lesson
        </Button>
      </div>

      {/* Lessons List */}
      {lessonsLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (lessons || []).length === 0 ? (
        <SectionCard className="p-10 text-center">
          <LkMonogram className="mx-auto mb-3 h-10 w-14 opacity-70" />
          <p className="text-sm text-dim">No lessons yet. Add the first one.</p>
        </SectionCard>
      ) : (
        <SectionCard className="px-4">
          <ul>
            {(lessons || []).map((lesson, i) => (
              <li key={lesson.id} className="border-t border-line-soft first:border-t-0">
                <div
                  className="group flex cursor-pointer items-center justify-between gap-4 py-3.5"
                  onClick={() => navigate(`/admin/curriculum/weeks/${weekId}/lessons/${lesson.id}`)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="w-6 text-center font-display text-lg font-bold text-dim" aria-hidden="true">{i + 1}</span>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold tracking-tight text-bone transition-colors group-hover:text-gold-bright">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-dim">
                        {lesson.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" /> {lesson.duration_minutes}m
                          </span>
                        )}
                        <span className="capitalize">{lesson.unlock_rule}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Badge variant={lesson.status === "published" ? "default" : "secondary"} className="text-xs capitalize">
                      {lesson.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit lesson" onClick={() => setEditDialog({ ...lesson })}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      aria-label={lesson.status === "published" ? "Unpublish lesson" : "Publish lesson"}
                      onClick={() => publishLesson.mutate({ id: lesson.id, publish: lesson.status !== "published" })}
                    >
                      {lesson.status === "published" ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Duplicate lesson" onClick={() => duplicateLesson.mutate(lesson.id)}>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete lesson" onClick={() => setDeleteId(lesson.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Edit/New Lesson Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold tracking-tight">{editDialog?.id ? "Edit Lesson" : "New Lesson"}</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editDialog.title} onChange={(e) => setEditDialog({ ...editDialog, title: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={editDialog.slug}
                  onChange={(e) => setEditDialog({ ...editDialog, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea value={editDialog.summary || ""} onChange={(e) => setEditDialog({ ...editDialog, summary: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editDialog.duration_minutes || ""}
                    onChange={(e) => setEditDialog({ ...editDialog, duration_minutes: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <Label>Unlock Rule</Label>
                  <Select value={editDialog.unlock_rule} onValueChange={(v) => setEditDialog({ ...editDialog, unlock_rule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit from Week</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="custom_day">Custom Day Offset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editDialog.unlock_rule === "custom_day" && (
                <div>
                  <Label>Custom Day Offset</Label>
                  <Input
                    type="number"
                    value={editDialog.unlock_day_offset || ""}
                    onChange={(e) => setEditDialog({ ...editDialog, unlock_day_offset: parseInt(e.target.value) || null })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveLesson.isPending}>
              {saveLesson.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold tracking-tight">Delete lesson?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteLesson.mutate(deleteId); setDeleteId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WeekDetail;
