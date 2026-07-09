import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Link as LinkIcon, Music } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurriculumLessonProgress, useMarkLessonComplete } from "@/hooks/useCurriculum";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { useForgeWeeks } from "@/hooks/useForgeCurriculum";
import { SignedAsset } from "@/components/curriculum/SignedAsset";
import { LessonComplete } from "@/components/grow/LessonComplete";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow, FoilRule, SectionCard } from "@/components/forge/atoms";
import { celebrate, celebrateBig } from "@/lib/celebrate";

type ContentBlock = {
  id?: string;
  type: string;
  // Heterogeneous CMS block payload (text/level/items/url/storagePath/alt/…),
  // shape varies per block type — intentionally loose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
};

/** Converts YouTube/Vimeo URLs to their embed form; anything else passes through. */
const VideoEmbed = ({ url }: { url: string }) => {
  let embedUrl = url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
  if (vimeoMatch) {
    const hash = vimeoMatch[2];
    embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1${hash ? `&h=${hash}` : ""}&playsinline=1&responsive=1`;
  }

  return (
    <iframe
      src={embedUrl}
      title="Lesson video"
      className="h-full w-full"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      {...({ webkitallowfullscreen: "", mozallowfullscreen: "" } as any)}
      sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
      loading="lazy"
    />
  );
};

/** 16:9 raised frame shared by every video surface on the page. */
const MediaFrame = ({ children }: { children: ReactNode }) => (
  <div className="aspect-video overflow-hidden rounded-lg border border-line bg-raised">
    {children}
  </div>
);

const attachmentClass =
  "flex items-center gap-3 rounded-lg border border-line bg-raised p-3 transition-colors hover:border-gold-deep/60";

const BlockRenderer = ({
  block,
  lessonId,
}: {
  block: ContentBlock;
  lessonId: string | undefined;
}) => {
  switch (block.type) {
    case "heading": {
      const Tag = (block.data.level || "h2") as keyof JSX.IntrinsicElements;
      return (
        <Tag className="font-display text-xl font-bold tracking-tight text-bone">
          {block.data.text}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p className="whitespace-pre-wrap font-serif text-lg leading-[1.8] text-bone/90">
          {block.data.text}
        </p>
      );
    case "bullet_list":
      return (
        <ul className="list-disc space-y-2 pl-6 font-serif text-lg leading-relaxed text-bone/90 marker:text-dim">
          {(block.data.items || []).filter(Boolean).map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="rounded-lg border border-gold-deep/40 bg-raised p-4">
          <p className="font-serif leading-relaxed text-bone">{block.data.text}</p>
        </div>
      );
    case "scripture":
      return (
        <SectionCard className="bg-gradient-to-br from-raised to-[hsl(35_23%_8%)] p-6">
          {block.data.reference && <Eyebrow tone="gold">{block.data.reference}</Eyebrow>}
          <p className="mt-2 font-serif text-lg italic leading-relaxed text-bone">
            “{block.data.text}”
          </p>
        </SectionCard>
      );
    case "video_embed":
      return block.data.url ? (
        <MediaFrame>
          <VideoEmbed url={block.data.url} />
        </MediaFrame>
      ) : null;
    case "video_upload":
      return block.data.storagePath || block.data.url ? (
        <MediaFrame>
          <SignedAsset rawValue={block.data.storagePath || block.data.url} lessonId={lessonId}>
            {(url) => <video src={url} controls className="h-full w-full" />}
          </SignedAsset>
        </MediaFrame>
      ) : null;
    case "audio_upload":
      return block.data.storagePath || block.data.url ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-raised p-3">
          <Music className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
          <SignedAsset rawValue={block.data.storagePath || block.data.url} lessonId={lessonId}>
            {(url) => <audio src={url} controls className="w-full" />}
          </SignedAsset>
        </div>
      ) : null;
    case "file_upload":
      return block.data.storagePath || block.data.url ? (
        <SignedAsset rawValue={block.data.storagePath || block.data.url} lessonId={lessonId}>
          {(url) => (
            <a href={url} target="_blank" rel="noopener noreferrer" className={attachmentClass}>
              <FileText className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <span className="text-sm font-medium text-bone">
                {block.data.filename || "Download File"}
              </span>
            </a>
          )}
        </SignedAsset>
      ) : null;
    case "image":
      return block.data.storagePath || block.data.url ? (
        <SignedAsset rawValue={block.data.storagePath || block.data.url} lessonId={lessonId}>
          {(url) => (
            <img
              src={url}
              alt={block.data.alt || ""}
              className="w-full rounded-lg border border-line"
            />
          )}
        </SignedAsset>
      ) : null;
    case "external_link":
      return block.data.url ? (
        <a
          href={block.data.url}
          target="_blank"
          rel="noopener noreferrer"
          className={attachmentClass}
        >
          <LinkIcon className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
          <span className="text-sm font-medium text-bone">
            {block.data.label || block.data.url}
          </span>
        </a>
      ) : null;
    case "divider":
      return <FoilRule className="mx-auto" />;
    default:
      return null;
  }
};

const Lesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { data: weeks } = useForgeWeeks();
  const { data: progressMap } = useCurriculumLessonProgress();
  const markComplete = useMarkLessonComplete();
  const { addEvidence } = useEvidenceCounter();

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[660px] px-5 py-8 sm:px-8">
        <Skeleton className="mb-6 h-8 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto max-w-[660px] px-5 py-16 text-center sm:px-8">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-bone">
          Reading not found
        </h1>
        <p className="mt-2 text-sm text-bone-2">It may have moved as the path was updated.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/app/grow">Back to the path</Link>
        </Button>
      </div>
    );
  }

  const isComplete = progressMap?.get(lesson.id)?.status === "completed";
  const week = weeks?.find((w) => w.id === lesson.week_id);
  const eyebrow = [
    week ? (week.isWorkbook ? week.title : `Week ${week.number} · ${week.title}`) : null,
    lesson.duration_minutes ? `${lesson.duration_minutes} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const blocks: ContentBlock[] = Array.isArray(lesson.content_json)
    ? (lesson.content_json as unknown as ContentBlock[])
    : [];

  const ordered = (weeks ?? []).filter((w) => !w.locked).flatMap((w) => w.lessons);
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  const next = idx >= 0 ? ordered[idx + 1] : undefined;

  // Live progress toward the week and the whole path (reflects the completion
  // once the progress query re-fetches, so the honor panel stays accurate).
  const weekLessons = week?.lessons ?? [];
  const overallLessons = (weeks ?? []).flatMap((w) => w.lessons);
  const weekDone = weekLessons.filter((l) => l.done).length;
  const weekTotal = weekLessons.length;
  const overallDone = overallLessons.filter((l) => l.done).length;
  const overallTotal = overallLessons.length;
  const nextUnlocksAt = next ? undefined : (weeks ?? []).find((w) => w.locked)?.unlocksAt;

  const markDone = async () => {
    try {
      const wasAlreadyComplete = progressMap?.get(lesson.id)?.status === "completed";
      // Decide the size of the moment before the write lands (progress is still
      // pre-completion here): finishing a week or the whole path earns the big burst.
      const willCompleteWeek =
        weekTotal > 0 && weekLessons.filter((l) => l.id !== lesson.id).every((l) => l.done);
      const willCompleteJourney =
        overallTotal > 0 && overallLessons.filter((l) => l.id !== lesson.id).every((l) => l.done);
      await markComplete.mutateAsync(lesson.id);
      if (!wasAlreadyComplete) {
        addEvidence.mutate("lesson_complete");
        if (willCompleteJourney || willCompleteWeek) {
          celebrateBig();
        } else {
          celebrate();
        }
      }
      toast.success("Reading finished. Carry it with you.");
    } catch {
      toast.error("Couldn't mark the reading finished. Try again.");
    }
  };

  return (
    <article className="mx-auto max-w-[660px] px-5 py-8 sm:px-8 lg:py-12">
      <Link
        to="/app/grow"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> The Liberated Path
      </Link>

      <header className="mb-8">
        {eyebrow && <Eyebrow className="mb-2 block">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-4xl font-bold tracking-tight text-bone sm:text-5xl">
          {lesson.title}
        </h1>
        {lesson.summary && (
          <p className="mt-3 font-serif text-base italic text-bone-2">{lesson.summary}</p>
        )}
        <FoilRule className="mt-6" />
      </header>

      {lesson.video_url && (
        <div className="mb-8">
          <MediaFrame>
            <VideoEmbed url={lesson.video_url} />
          </MediaFrame>
        </div>
      )}

      <div className="space-y-6 break-words [overflow-wrap:anywhere]">
        {blocks.map((block, i) => (
          <BlockRenderer key={block.id ?? i} block={block} lessonId={lessonId} />
        ))}
      </div>

      {isComplete ? (
        <LessonComplete
          weekNumber={week?.number}
          weekTitle={week?.title}
          weekDone={weekDone}
          weekTotal={weekTotal}
          overallDone={overallDone}
          overallTotal={overallTotal}
          next={next ? { id: next.id, title: next.title } : undefined}
          nextUnlocksAt={nextUnlocksAt}
        />
      ) : (
        <SectionCard hatch className="mt-10 p-6">
          <Eyebrow tone="gold" className="mb-3 block">
            Carry it
          </Eyebrow>
          <label htmlFor="lesson-notes" className="sr-only">
            Your reflection (optional)
          </label>
          <Textarea id="lesson-notes" rows={3} placeholder="Your words, kept private…" className="mb-4" />
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={markDone} disabled={markComplete.isPending} className="flex-1">
              {markComplete.isPending ? "Marking…" : "Mark reading finished"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/app")}>
              Finish later
            </Button>
          </div>
        </SectionCard>
      )}
    </article>
  );
};

export default Lesson;
