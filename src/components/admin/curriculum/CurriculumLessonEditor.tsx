import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, Loader2, Save, Eye, EyeOff, Plus, Trash2, GripVertical,
  Type, AlignLeft, List, Quote, BookOpen, Video, Music, FileText, Link, Image, Minus,
} from "lucide-react";
import {
  useCurriculumLesson, useSaveCurriculumLesson, usePublishCurriculumLesson,
} from "@/hooks/useAdminCurriculumNew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type ContentBlock = {
  id: string;
  type: string;
  data: Record<string, any>;
};

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "paragraph", label: "Paragraph", icon: AlignLeft },
  { type: "bullet_list", label: "Bullet List", icon: List },
  { type: "callout", label: "Callout", icon: Quote },
  { type: "scripture", label: "Scripture", icon: BookOpen },
  { type: "video_embed", label: "Video Embed", icon: Video },
  { type: "video_upload", label: "Video Upload", icon: Video },
  { type: "audio_upload", label: "Audio Upload", icon: Music },
  { type: "file_upload", label: "PDF / File", icon: FileText },
  { type: "external_link", label: "External Link", icon: Link },
  { type: "image", label: "Image", icon: Image },
  { type: "divider", label: "Divider", icon: Minus },
];

const genId = () => crypto.randomUUID();

const CurriculumLessonEditor = () => {
  const { weekId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: lesson, isLoading } = useCurriculumLesson(lessonId);
  const saveLesson = useSaveCurriculumLesson();
  const publishLesson = usePublishCurriculumLesson();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setSummary(lesson.summary || "");
      setVideoUrl(lesson.video_url || "");
      setAudioUrl(lesson.audio_url || "");
      const parsed = Array.isArray(lesson.content_json) ? lesson.content_json : [];
      setBlocks(parsed.map((b: any) => ({ id: b.id || genId(), type: b.type, data: b.data || {} })));
      setDirty(false);
    }
  }, [lesson]);

  const markDirty = useCallback(() => setDirty(true), []);

  const addBlock = (type: string) => {
    setBlocks(prev => [...prev, { id: genId(), type, data: {} }]);
    markDirty();
  };

  const updateBlock = (id: string, data: Record<string, any>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data } : b));
    markDirty();
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    markDirty();
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
    markDirty();
  };

  const handleFileUpload = async (blockId: string, file: File, type: "video" | "audio" | "file" | "image") => {
    const maxSize = type === "video" ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: `Max ${type === "video" ? "500MB" : "50MB"}`, variant: "destructive" });
      return;
    }

    setUploading(blockId);
    const ext = file.name.split(".").pop();
    const path = `${type}s/${lessonId}/${blockId}.${ext}`;

    const { error } = await supabase.storage.from("curriculum-files").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("curriculum-files").getPublicUrl(path);
    updateBlock(blockId, { url: urlData.publicUrl, filename: file.name, size: file.size });
    setUploading(null);
    toast({ title: "File uploaded" });
  };

  const handleSave = async () => {
    await saveLesson.mutateAsync({
      id: lessonId,
      title,
      summary: summary || null,
      video_url: videoUrl || null,
      audio_url: audioUrl || null,
      content_json: blocks,
    });
    setDirty(false);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/curriculum/weeks/${weekId}`)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl font-bold truncate">{title || "Untitled Lesson"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={lesson?.status === "published" ? "default" : "secondary"}>{lesson?.status}</Badge>
          {dirty && <Badge variant="outline" className="text-warning border-warning">Unsaved</Badge>}
          <Button
            variant="outline" size="sm"
            onClick={() => publishLesson.mutate({ id: lessonId!, publish: lesson?.status !== "published" })}
            disabled={publishLesson.isPending}
          >
            {lesson?.status === "published" ? <><EyeOff className="h-4 w-4 mr-1" /> Unpublish</> : <><Eye className="h-4 w-4 mr-1" /> Publish</>}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveLesson.isPending || !dirty} className="gap-2">
            {saveLesson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={(e) => { setSummary(e.target.value); markDirty(); }} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Video URL (YouTube/Vimeo)</Label>
              <Input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); markDirty(); }} placeholder="https://..." />
            </div>
            <div>
              <Label>Audio URL</Label>
              <Input value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); markDirty(); }} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Blocks */}
      <div>
        <h2 className="font-serif text-lg font-semibold mb-3">Content Blocks</h2>
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
              onUpdate={(data) => updateBlock(block.id, data)}
              onRemove={() => removeBlock(block.id)}
              onMove={(dir) => moveBlock(i, dir)}
              onFileUpload={(file, type) => handleFileUpload(block.id, file, type)}
              isUploading={uploading === block.id}
            />
          ))}
        </div>

        {/* Add Block */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Add Block</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <Button key={type} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => addBlock(type)}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function BlockEditor({ block, index, total, onUpdate, onRemove, onMove, onFileUpload, isUploading }: {
  block: ContentBlock;
  index: number;
  total: number;
  onUpdate: (data: Record<string, any>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onFileUpload: (file: File, type: "video" | "audio" | "file" | "image") => void;
  isUploading: boolean;
}) {
  const blockDef = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockDef?.icon || AlignLeft;

  return (
    <Card className="border-border/50">
      <CardContent className="py-3">
        <div className="flex items-start gap-2">
          {/* Reorder Controls */}
          <div className="flex flex-col items-center gap-0.5 pt-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(-1)} disabled={index === 0}>
              <GripVertical className="h-3 w-3 rotate-90" />
            </Button>
            <span className="text-[10px] text-muted-foreground">{index + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(1)} disabled={index === total - 1}>
              <GripVertical className="h-3 w-3 rotate-90" />
            </Button>
          </div>

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">{blockDef?.label}</span>
            </div>
            <BlockContent block={block} onUpdate={onUpdate} onFileUpload={onFileUpload} isUploading={isUploading} />
          </div>

          {/* Remove */}
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BlockContent({ block, onUpdate, onFileUpload, isUploading }: {
  block: ContentBlock;
  onUpdate: (data: Record<string, any>) => void;
  onFileUpload: (file: File, type: "video" | "audio" | "file" | "image") => void;
  isUploading: boolean;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <Select value={block.data.level || "h2"} onValueChange={(v) => onUpdate({ ...block.data, level: v })}>
            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
              <SelectItem value="h4">H4</SelectItem>
            </SelectContent>
          </Select>
          <Input value={block.data.text || ""} onChange={(e) => onUpdate({ ...block.data, text: e.target.value })} placeholder="Heading text..." />
        </div>
      );

    case "paragraph":
      return <Textarea value={block.data.text || ""} onChange={(e) => onUpdate({ ...block.data, text: e.target.value })} placeholder="Paragraph text..." rows={3} />;

    case "bullet_list":
      return (
        <Textarea
          value={block.data.items?.join("\n") || ""}
          onChange={(e) => onUpdate({ ...block.data, items: e.target.value.split("\n") })}
          placeholder="One bullet point per line..."
          rows={4}
        />
      );

    case "callout":
      return (
        <div className="space-y-2">
          <Select value={block.data.style || "info"} onValueChange={(v) => onUpdate({ ...block.data, style: v })}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="highlight">Highlight</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={block.data.text || ""} onChange={(e) => onUpdate({ ...block.data, text: e.target.value })} placeholder="Callout text..." rows={2} />
        </div>
      );

    case "scripture":
      return (
        <div className="space-y-2">
          <Input value={block.data.reference || ""} onChange={(e) => onUpdate({ ...block.data, reference: e.target.value })} placeholder="e.g. Romans 8:1" />
          <Textarea value={block.data.text || ""} onChange={(e) => onUpdate({ ...block.data, text: e.target.value })} placeholder="Scripture text..." rows={3} />
        </div>
      );

    case "video_embed":
      return <Input value={block.data.url || ""} onChange={(e) => onUpdate({ ...block.data, url: e.target.value })} placeholder="YouTube or Vimeo URL..." />;

    case "video_upload":
    case "audio_upload":
    case "file_upload":
    case "image": {
      const fileType = block.type === "video_upload" ? "video" : block.type === "audio_upload" ? "audio" : block.type === "image" ? "image" : "file";
      const accept = fileType === "video" ? "video/*" : fileType === "audio" ? "audio/*" : fileType === "image" ? "image/*" : ".pdf,.doc,.docx,.pptx,.xlsx";
      return (
        <div className="space-y-2">
          {block.data.url ? (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary text-sm">
              <span className="truncate flex-1">{block.data.filename || block.data.url}</span>
              <Button variant="ghost" size="sm" onClick={() => onUpdate({})}>Replace</Button>
            </div>
          ) : (
            <div>
              <Input
                type="file"
                accept={accept}
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileUpload(file, fileType);
                }}
              />
              {isUploading && <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</div>}
            </div>
          )}
          {block.type === "image" && block.data.url && (
            <Input value={block.data.alt || ""} onChange={(e) => onUpdate({ ...block.data, alt: e.target.value })} placeholder="Alt text..." />
          )}
        </div>
      );
    }

    case "external_link":
      return (
        <div className="space-y-2">
          <Input value={block.data.url || ""} onChange={(e) => onUpdate({ ...block.data, url: e.target.value })} placeholder="URL..." />
          <Input value={block.data.label || ""} onChange={(e) => onUpdate({ ...block.data, label: e.target.value })} placeholder="Link label..." />
        </div>
      );

    case "divider":
      return <hr className="border-border" />;

    default:
      return <p className="text-sm text-muted-foreground">Unknown block type</p>;
  }
}

export default CurriculumLessonEditor;
