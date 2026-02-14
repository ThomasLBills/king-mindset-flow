import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft, Plus, Pencil, Trash2, Loader2, Copy, Eye, EyeOff, FileText, Clock,
} from "lucide-react";
import {
  useWeek, useCurriculumLessons, useSaveCurriculumLesson,
  useDeleteCurriculumLesson, usePublishCurriculumLesson, useDuplicateCurriculumLesson,
} from "@/hooks/useAdminCurriculumNew";
import { motion } from "framer-motion";

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

  if (weekLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/curriculum")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl font-bold truncate">{week?.title}</h1>
          <p className="text-sm text-muted-foreground">{week?.summary || "No summary"}</p>
        </div>
        <Badge>{week?.status}</Badge>
      </div>

      {/* Lessons Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-lg font-semibold">Lessons ({lessons?.length || 0})</h2>
        <Button size="sm" onClick={openNewLesson} className="gap-2">
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>

      {/* Lessons List */}
      {lessonsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (lessons || []).length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No lessons yet. Add your first lesson.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(lessons || []).map((lesson, i) => (
            <Card
              key={lesson.id}
              className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/curriculum/weeks/${weekId}/lessons/${lesson.id}`)}
            >
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-mono text-muted-foreground w-6 text-center">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-semibold truncate">{lesson.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {lesson.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {lesson.duration_minutes}m
                        </span>
                      )}
                      <span className="capitalize text-xs">{lesson.unlock_rule}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={lesson.status === "published" ? "default" : "secondary"} className="text-xs">
                    {lesson.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDialog({ ...lesson })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => publishLesson.mutate({ id: lesson.id, publish: lesson.status !== "published" })}
                  >
                    {lesson.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateLesson.mutate(lesson.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(lesson.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/New Lesson Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{editDialog?.id ? "Edit Lesson" : "New Lesson"}</DialogTitle>
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
              {saveLesson.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lesson?</AlertDialogTitle>
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
    </motion.div>
  );
};

export default WeekDetail;
