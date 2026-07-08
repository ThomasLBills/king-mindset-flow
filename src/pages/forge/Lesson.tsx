import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useCompleteLesson, useLesson, useWeeks } from "@/mock/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow, FoilRule, SectionCard } from "@/components/forge/atoms";

const Lesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { data: lesson, isLoading } = useLesson(lessonId);
  const { data: weeks } = useWeeks();
  const complete = useCompleteLesson();

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

  const ordered = (weeks ?? []).filter((w) => !w.locked).flatMap((w) => w.lessons);
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  const next = idx >= 0 ? ordered[idx + 1] : undefined;

  const markDone = () =>
    complete.mutate(lesson.id, {
      onSuccess: () => toast.success("Reading finished. Carry it with you."),
    });

  return (
    <article className="mx-auto max-w-[660px] px-5 py-8 sm:px-8 lg:py-12">
      <Link
        to="/app/grow"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> The Liberated Path
      </Link>

      <header className="mb-8">
        <Eyebrow className="mb-2 block">
          Week {lesson.weekNumber} · {lesson.weekTitle} · {lesson.minutes} min
        </Eyebrow>
        <h1 className="font-display text-4xl font-bold tracking-tight text-bone sm:text-5xl">
          {lesson.title}
        </h1>
        <FoilRule className="mt-6" />
      </header>

      {lesson.scripture && (
        <SectionCard className="mb-8 bg-gradient-to-br from-raised to-[hsl(35_23%_8%)] p-6">
          <Eyebrow tone="gold">{lesson.scripture.ref}</Eyebrow>
          <p className="mt-2 font-serif text-lg italic leading-relaxed text-bone">
            “{lesson.scripture.text}”
          </p>
        </SectionCard>
      )}

      <div className="space-y-6">
        {lesson.body.map((para, i) => (
          <p key={i} className="font-serif text-lg leading-[1.8] text-bone/90">
            {para}
          </p>
        ))}
      </div>

      <SectionCard hatch className="mt-10 p-6">
        <Eyebrow tone="gold" className="mb-2 block">
          Carry it
        </Eyebrow>
        <p className="mb-4 font-serif italic leading-relaxed text-bone-2">{lesson.reflection}</p>
        {!lesson.done && (
          <>
            <label htmlFor="lesson-notes" className="sr-only">
              Your reflection (optional)
            </label>
            <Textarea id="lesson-notes" rows={3} placeholder="Your words, kept private…" className="mb-4" />
          </>
        )}
        {lesson.done ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-sm text-gold">
              <Check className="h-4 w-4" aria-hidden="true" /> Finished
            </p>
            {next && (
              <Button asChild variant="outline" className="sm:ml-auto">
                <Link to={`/app/grow/lesson/${next.id}`}>Next: {next.title}</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={markDone} disabled={complete.isPending} className="flex-1">
              {complete.isPending ? "Marking…" : "Mark reading finished"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/app")}>
              Finish later
            </Button>
          </div>
        )}
      </SectionCard>
    </article>
  );
};

export default Lesson;
