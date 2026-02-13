import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Loader2, Search, BookOpen } from "lucide-react";
import { useCourses, useSaveCourse, useDeleteCourse } from "@/hooks/useAdminCurriculum";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

const CoursesList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: courses, isLoading } = useCourses();
  const saveCourse = useSaveCourse();
  const deleteCourse = useDeleteCourse();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialog, setEditDialog] = useState<any>(searchParams.get("new") ? { title: "", slug: "", description: "", status: "draft", visibility: "paid" } : null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = (courses || []).filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async () => {
    if (!editDialog.title || !editDialog.slug) return;
    await saveCourse.mutateAsync(editDialog);
    setEditDialog(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">Manage your curriculum courses</p>
        </div>
        <Button onClick={() => setEditDialog({ title: "", slug: "", description: "", status: "draft", visibility: "paid" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No courses yet. Create your first course to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((course) => (
            <Card key={course.id} className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/admin/courses/${course.id}`)}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-lg font-semibold truncate">{course.title}</h3>
                    <Badge variant={statusColors[course.status] as any}>{course.status}</Badge>
                    <Badge variant="outline" className="text-xs">{course.visibility}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{course.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => setEditDialog(course)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(course.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{editDialog?.id ? "Edit Course" : "New Course"}</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editDialog.title} onChange={(e) => setEditDialog({ ...editDialog, title: e.target.value })} placeholder="Course title" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={editDialog.slug} onChange={(e) => setEditDialog({ ...editDialog, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="course-slug" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editDialog.description || ""} onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Status</Label>
                  <Select value={editDialog.status} onValueChange={(v) => setEditDialog({ ...editDialog, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Visibility</Label>
                  <Select value={editDialog.visibility} onValueChange={(v) => setEditDialog({ ...editDialog, visibility: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveCourse.isPending}>
              {saveCourse.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the course and all its modules and lessons. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteCourse.mutate(deleteId); setDeleteId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CoursesList;
