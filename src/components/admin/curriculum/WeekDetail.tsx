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
  ChevronLeft, Plus, Pencil, Trash2, Loader2, Copy, Eye, EyeOff, Clock, BookOpen,
} from "lucide-react";
import {
  useWeek, useCurriculumLessons, useSaveCurriculumLesson,
  useDeleteCurriculumLesson, usePublishCurriculumLesson, useDuplicateCurriculumLesson,
} from "@/hooks/useAdminCurriculumNew";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { ErrorState, EmptyState, useConfirm } from "@/components/feedback";

const WeekDetail = () => {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: week, isLoading: weekLoading, isError: weekError, refetch: refetchWeek } = useWeek(weekId);
  const { data: lessons, isLoading: lessonsLoading, isError: lessonsError, refetch: refetchLessons } = useCurriculumLessons(weekId);
  const saveLesson = useSaveCurriculumLesson();
  const deleteLesson = useDeleteCurriculumLesson();
  const publishLesson = usePublishCurriculumLesson();
  const duplicateLesson = useDuplicateCurriculumLesson();

  const [editDialog, setEditDialog] = useState<any>(null);

  const handleSave = async () => {
    if (!editDialog?.title || !editDialog?.slug) return;
    try {
      await saveLesson.mutateAsync({ ...editDialog, week_id: weekId });
      setEditDialog(null);
    } catch {
      // Failure surfaces via the global mutation-error net; keep the dialog
      // open so the admin can retry without re-entering everything.
    }
  };

  const handleTogglePublish = async (lesson: { id: string; title: string; status: string }) => {
    const publish = lesson.status !== "published";
    const ok = await confirm({
      title: publish ? `Publish "${lesson.title}"?` : `Unpublish "${lesson.title}"?`,
      consequence: publish
        ? "The lesson becomes visible to members immediately."
        : "Members will no longer be able to see this lesson.",
      confirmLabel: publish ? "Publish" : "Unpublish",
    });
    if (!ok) return;
    publishLesson.mutate({ id: lesson.id, publish });
  };

  const handleDelete = async (lesson: { id: string; title: string }) => {
    const ok = await confirm({
      title: "Delete lesson?",
      consequence: `"${lesson.title}" and its content will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    deleteLesson.mutate(lesson.id);
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

  if (weekError) return (
    <ErrorState
      title="Couldn't load this week"
      message="Something went wrong fetching the week."
      onRetry={() => refetchWeek()}
    />
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
      ) : lessonsError ? (
        <SectionCard className="p-6">
          <ErrorState
            title="Couldn't load lessons"
            message="Something went wrong fetching the lessons for this week."
            onRetry={() => refetchLessons()}
          />
        </SectionCard>
      ) : (lessons || []).length === 0 ? (
        <SectionCard className="p-6">
          <EmptyState icon={BookOpen} title="No lessons yet" description="Add the first lesson to build out this week." />
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
                      onClick={() => handleTogglePublish(lesson)}
                      disabled={publishLesson.isPending}
                    >
                      {lesson.status === "published" ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Duplicate lesson" onClick={() => duplicateLesson.mutate(lesson.id)} disabled={duplicateLesson.isPending}>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete lesson" onClick={() => handleDelete(lesson)} disabled={deleteLesson.isPending}>
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
    </div>
  );
};

export default WeekDetail;
