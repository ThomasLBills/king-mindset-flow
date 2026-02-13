import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Plus, Pencil, Trash2, Copy, Loader2, FileText, Eye, EyeOff } from "lucide-react";
import { useLessons, useSaveLesson, useDeleteLesson, useDuplicateLesson, usePublishLesson } from "@/hooks/useAdminCurriculum";
import { useModules } from "@/hooks/useAdminCurriculum";
import { motion } from "framer-motion";

const ModuleDetail = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { data: modules } = useModules(courseId);
  const mod = modules?.find((m) => m.id === moduleId);
  const { data: lessons, isLoading } = useLessons(moduleId);
  const saveLesson = useSaveLesson();
  const deleteLesson = useDeleteLesson();
  const duplicateLesson = useDuplicateLesson();
  const publishLesson = usePublishLesson();

  const [newDialog, setNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTitle || !newSlug) return;
    const result = await saveLesson.mutateAsync({
      module_id: moduleId,
      title: newTitle,
      slug: newSlug,
      order_index: lessons?.length || 0,
    });
    setNewDialog(false);
    setNewTitle("");
    setNewSlug("");
    navigate(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${result.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/courses/${courseId}`)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold">{mod?.title || "Module"}</h1>
          <p className="text-sm text-muted-foreground">Lessons in this module</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="font-serif text-lg font-semibold">Lessons ({lessons?.length || 0})</h2>
        <Button size="sm" onClick={() => setNewDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (lessons || []).length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No lessons yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(lessons || []).map((lesson, i) => (
            <Card key={lesson.id} className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`)}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-mono text-muted-foreground w-6 text-center">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-semibold truncate">{lesson.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "No duration"} · {lesson.published_at ? `Published ${new Date(lesson.published_at).toLocaleDateString()}` : "Not published"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={lesson.status === "published" ? "default" : "secondary"}>{lesson.status}</Badge>
                  <Button variant="ghost" size="icon" title={lesson.status === "published" ? "Unpublish" : "Publish"}
                    onClick={() => publishLesson.mutate({ id: lesson.id, publish: lesson.status !== "published" })}>
                    {lesson.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicateLesson.mutate(lesson.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(lesson.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Lesson Dialog */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">New Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")); }} /></div>
            <div><Label>Slug</Label><Input value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saveLesson.isPending}>Create & Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete lesson?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteId) deleteLesson.mutate(deleteId); setDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ModuleDetail;
