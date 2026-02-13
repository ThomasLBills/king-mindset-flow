import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, Save, Eye, EyeOff, Plus, Trash2, GripVertical, Type, Video, FileText, Link2, List, AlertCircle, Loader2,
} from "lucide-react";
import { useLesson, useSaveLesson, usePublishLesson } from "@/hooks/useAdminCurriculum";
import { motion } from "framer-motion";

type ContentBlock = {
  id: string;
  type: "text" | "heading" | "video" | "callout" | "list" | "link";
  content: string;
  level?: number; // for headings
};

const blockIcons: Record<string, any> = {
  text: Type,
  heading: Type,
  video: Video,
  callout: AlertCircle,
  list: List,
  link: Link2,
};

const LessonEditor = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { data: lesson, isLoading } = useLesson(lessonId);
  const saveLesson = useSaveLesson();
  const publishLesson = usePublishLesson();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setSlug(lesson.slug);
      setSummary(lesson.summary || "");
      setVideoUrl(lesson.video_url || "");
      setAudioUrl(lesson.audio_url || "");
      setDuration(lesson.duration_minutes?.toString() || "");
      const parsed = Array.isArray(lesson.content_json) ? (lesson.content_json as ContentBlock[]) : [];
      setBlocks(parsed.length ? parsed : [{ id: crypto.randomUUID(), type: "text", content: "" }]);
      setHasChanges(false);
    }
  }, [lesson]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks((b) => b.map((bl) => (bl.id === id ? { ...bl, ...updates } : bl)));
    markChanged();
  };

  const addBlock = (type: ContentBlock["type"]) => {
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type, content: "", level: type === "heading" ? 2 : undefined }]);
    markChanged();
  };

  const removeBlock = (id: string) => {
    setBlocks((b) => b.filter((bl) => bl.id !== id));
    markChanged();
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    markChanged();
  };

  const handleSave = async () => {
    await saveLesson.mutateAsync({
      id: lessonId,
      title,
      slug,
      summary,
      video_url: videoUrl || null,
      audio_url: audioUrl || null,
      duration_minutes: duration ? parseInt(duration) : null,
      content_json: blocks,
    });
    setHasChanges(false);
  };

  const handlePublish = async (publish: boolean) => {
    if (hasChanges) await handleSave();
    await publishLesson.mutateAsync({ id: lessonId!, publish });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/courses/${courseId}/modules/${moduleId}`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold">Edit Lesson</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={lesson?.status === "published" ? "default" : "secondary"}>{lesson?.status}</Badge>
              {hasChanges && <Badge variant="outline" className="text-warning border-warning">Unsaved changes</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePublish(lesson?.status !== "published")} disabled={publishLesson.isPending}>
            {lesson?.status === "published" ? <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</> : <><Eye className="h-4 w-4 mr-2" /> Publish</>}
          </Button>
          <Button onClick={handleSave} disabled={saveLesson.isPending || !hasChanges} className="gap-2">
            {saveLesson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Meta fields */}
      <Card className="card-elevated">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={title} onChange={(e) => { setTitle(e.target.value); markChanged(); }} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); markChanged(); }} /></div>
          </div>
          <div><Label>Summary</Label><Textarea value={summary} onChange={(e) => { setSummary(e.target.value); markChanged(); }} rows={2} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Video URL</Label><Input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); markChanged(); }} placeholder="YouTube or Vimeo URL" /></div>
            <div><Label>Audio URL</Label><Input value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); markChanged(); }} placeholder="Audio file URL" /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => { setDuration(e.target.value); markChanged(); }} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Content Blocks */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Content Blocks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((block, i) => (
            <div key={block.id} className="group relative border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{block.type}</Badge>
                  {block.type === "heading" && (
                    <Select value={String(block.level || 2)} onValueChange={(v) => updateBlock(block.id, { level: Number(v) })}>
                      <SelectTrigger className="w-[70px] h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">H1</SelectItem>
                        <SelectItem value="2">H2</SelectItem>
                        <SelectItem value="3">H3</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeBlock(block.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              {block.type === "text" || block.type === "callout" || block.type === "list" ? (
                <Textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder={block.type === "list" ? "One item per line..." : block.type === "callout" ? "Callout text..." : "Write content..."}
                  rows={block.type === "text" ? 4 : 3}
                />
              ) : block.type === "heading" ? (
                <Input value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder="Heading text..." />
              ) : block.type === "video" ? (
                <Input value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder="YouTube or Vimeo embed URL..." />
              ) : block.type === "link" ? (
                <Input value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder="https://..." />
              ) : null}
            </div>
          ))}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-muted-foreground mr-2 self-center">Add block:</p>
            {(["text", "heading", "video", "callout", "list", "link"] as const).map((type) => {
              const Icon = blockIcons[type];
              return (
                <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)} className="gap-1.5 capitalize">
                  <Icon className="h-3.5 w-3.5" /> {type}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LessonEditor;
