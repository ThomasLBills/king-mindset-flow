import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Plus, Pencil, Trash2, Loader2, Layers } from "lucide-react";
import { useCourse, useModules, useSaveModule, useDeleteModule, useLessons } from "@/hooks/useAdminCurriculum";
import { motion } from "framer-motion";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modules, isLoading: modulesLoading } = useModules(courseId);
  const saveModule = useSaveModule();
  const deleteModule = useDeleteModule();

  const [editDialog, setEditDialog] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editDialog.title || !editDialog.slug) return;
    await saveModule.mutateAsync({ ...editDialog, course_id: courseId });
    setEditDialog(null);
  };

  if (courseLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold">{course?.title}</h1>
          <p className="text-sm text-muted-foreground">Modules in this course</p>
        </div>
        <Badge className="ml-auto">{course?.status}</Badge>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="font-serif text-lg font-semibold">Modules ({modules?.length || 0})</h2>
        <Button size="sm" onClick={() => setEditDialog({ title: "", slug: "", description: "", status: "draft", order_index: (modules?.length || 0) })} className="gap-2">
          <Plus className="h-4 w-4" /> Add Module
        </Button>
      </div>

      {modulesLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (modules || []).length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No modules yet. Add your first module.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(modules || []).map((mod, i) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              index={i}
              onEdit={() => setEditDialog(mod)}
              onDelete={() => setDeleteId(mod.id)}
              onClick={() => navigate(`/admin/courses/${courseId}/modules/${mod.id}`)}
            />
          ))}
        </div>
      )}

      {/* Module Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{editDialog?.id ? "Edit Module" : "New Module"}</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editDialog.title} onChange={(e) => setEditDialog({ ...editDialog, title: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={editDialog.slug} onChange={(e) => setEditDialog({ ...editDialog, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
              <div><Label>Description</Label><Textarea value={editDialog.description || ""} onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveModule.isPending}>
              {saveModule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete module?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the module and all its lessons.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteId) deleteModule.mutate(deleteId); setDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

function ModuleCard({ mod, index, onEdit, onDelete, onClick }: any) {
  return (
    <Card className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-sm font-mono text-muted-foreground w-6 text-center">{index + 1}</span>
          <div className="min-w-0">
            <h3 className="font-serif text-base font-semibold truncate">{mod.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{mod.description || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant={mod.status === "published" ? "default" : "secondary"}>{mod.status}</Badge>
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CourseDetail;
