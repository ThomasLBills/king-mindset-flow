import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Check, Loader2, Play, BookOpen, Music, FileText, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useMarkLessonComplete, useCurriculumLessonProgress } from "@/hooks/useCurriculum";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ContentBlock = {
  id: string;
  type: string;
  data: Record<string, any>;
};

const LessonView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const markComplete = useMarkLessonComplete();
  const { data: progressMap } = useCurriculumLessonProgress();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["public-curriculum-lesson", lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .select("*")
        .eq("id", lessonId!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const isComplete = progressMap?.get(lessonId || "")?.status === "completed";

  const handleMarkComplete = async () => {
    if (!lessonId) return;
    await markComplete.mutateAsync(lessonId);
    toast({ title: "Lesson marked complete!" });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!lesson) {
    return (
      <AppLayout>
        <div className="px-5 py-6 text-center">
          <p className="text-muted-foreground">Lesson not found or not published.</p>
          <Button variant="ghost" onClick={() => navigate("/library")} className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Library
          </Button>
        </div>
      </AppLayout>
    );
  }

  const blocks: ContentBlock[] = Array.isArray(lesson.content_json)
    ? (lesson.content_json as any[])
    : [];

  return (
    <AppLayout>
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/library")} className="mb-4 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Library
          </Button>

          <h1 className="font-serif text-2xl font-bold mb-2">{lesson.title}</h1>
          {lesson.summary && (
            <p className="text-muted-foreground mb-4">{lesson.summary}</p>
          )}

          <div className="flex items-center gap-2 mb-6">
            {lesson.duration_minutes && (
              <Badge variant="secondary">{lesson.duration_minutes} min</Badge>
            )}
            {isComplete && (
              <Badge className="bg-success text-success-foreground">
                <Check className="h-3 w-3 mr-1" /> Completed
              </Badge>
            )}
          </div>

          {/* Main video */}
          {lesson.video_url && (
            <div className="mb-6 rounded-xl overflow-hidden bg-secondary aspect-video">
              <VideoEmbed url={lesson.video_url} />
            </div>
          )}

          {/* Content blocks */}
          <div className="space-y-4 mb-8">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>

          {/* Mark Complete */}
          {!isComplete && (
            <div className="sticky bottom-20 py-3">
              <Button onClick={handleMarkComplete} disabled={markComplete.isPending} className="w-full gap-2">
                {markComplete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Mark as Complete
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

function VideoEmbed({ url }: { url: string }) {
  // Convert YouTube/Vimeo URLs to embed
  let embedUrl = url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return (
    <iframe
      src={embedUrl}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading": {
      const Tag = (block.data.level || "h2") as keyof JSX.IntrinsicElements;
      return <Tag className="font-serif font-bold text-xl">{block.data.text}</Tag>;
    }
    case "paragraph":
      return <p className="text-foreground leading-relaxed whitespace-pre-wrap">{block.data.text}</p>;
    case "bullet_list":
      return (
        <ul className="list-disc pl-6 space-y-1">
          {(block.data.items || []).filter(Boolean).map((item: string, i: number) => (
            <li key={i} className="text-foreground">{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-foreground">{block.data.text}</p>
        </div>
      );
    case "scripture":
      return (
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 italic">
          <p className="text-foreground mb-1">{block.data.text}</p>
          <p className="text-sm font-semibold text-accent not-italic">— {block.data.reference}</p>
        </div>
      );
    case "video_embed":
      return (
        <div className="rounded-xl overflow-hidden bg-secondary aspect-video">
          <VideoEmbed url={block.data.url || ""} />
        </div>
      );
    case "video_upload":
      return block.data.url ? (
        <div className="rounded-xl overflow-hidden bg-secondary aspect-video">
          <video src={block.data.url} controls className="w-full h-full" />
        </div>
      ) : null;
    case "audio_upload":
      return block.data.url ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
          <Music className="h-5 w-5 text-primary shrink-0" />
          <audio src={block.data.url} controls className="w-full" />
        </div>
      ) : null;
    case "file_upload":
      return block.data.url ? (
        <a href={block.data.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium">{block.data.filename || "Download File"}</span>
        </a>
      ) : null;
    case "image":
      return block.data.url ? (
        <img src={block.data.url} alt={block.data.alt || ""} className="rounded-xl w-full" />
      ) : null;
    case "external_link":
      return block.data.url ? (
        <a href={block.data.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <LinkIcon className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium">{block.data.label || block.data.url}</span>
        </a>
      ) : null;
    case "divider":
      return <hr className="border-border" />;
    default:
      return null;
  }
}

export default LessonView;
