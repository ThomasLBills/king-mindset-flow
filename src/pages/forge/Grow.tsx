import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForgeWeeks, type ForgeWeek } from "@/hooks/useForgeCurriculum";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { PageBackdrop } from "@/components/forge/scenes";

const pad = (n: number) => String(n).padStart(2, "0");

/** Workbook / reading items have no video runtime — show "Lesson" not "0 min". */
const durationLabel = (minutes?: number | null) =>
  minutes && minutes > 0 ? `${minutes} min` : "Lesson";

const LessonRow = ({
  weekLocked,
  lesson,
  isNext = false,
}: {
  weekLocked: boolean;
  lesson: ForgeWeek["lessons"][number];
  isNext?: boolean;
}) => (
  <li className="border-t border-line-soft first:border-t-0">
    {weekLocked ? (
      <span className="flex items-center gap-3 py-3 text-sm text-dim">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-line" aria-hidden="true" />
        {lesson.title}
        <span className="ml-auto text-xs">{durationLabel(lesson.minutes)}</span>
      </span>
    ) : (
      <Link
        to={`/app/grow/lesson/${lesson.id}`}
        className={cn(
          "group flex items-center gap-3 py-3 text-sm",
          isNext && "-mx-3 rounded-md bg-[hsl(38_45%_9%)]/50 px-3"
        )}
      >
        <span
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
            lesson.done
              ? "border-gold-deep bg-[hsl(38_45%_9%)] text-gold"
              : isNext
                ? "border-gold text-gold motion-safe:animate-pulse-gentle"
                : "border-line text-dim"
          )}
          aria-hidden="true"
        >
          {lesson.done && <Check className="h-3 w-3" />}
        </span>
        <span
          className={cn(
            "transition-colors group-hover:text-gold-bright",
            lesson.done ? "text-bone-2" : isNext ? "font-medium text-bone" : "text-bone"
          )}
        >
          {lesson.title}
        </span>
        <span className="ml-auto flex items-center gap-2.5">
          {isNext && !lesson.done && <Eyebrow tone="gold">Next</Eyebrow>}
          <span className="text-xs text-dim">
            {durationLabel(lesson.minutes)}
            {lesson.done && " · Completed"}
          </span>
        </span>
      </Link>
    )}
  </li>
);

const Grow = () => {
  const { data: weeks } = useForgeWeeks();

  if (!weeks) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
        <Skeleton className="mb-4 h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const allLessons = weeks.flatMap((w) => w.lessons);
  const doneCount = allLessons.filter((l) => l.done).length;
  const overallPct = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;
  const current = weeks.find((w) => !w.locked && w.lessons.some((l) => !l.done));
  const past = weeks.filter((w) => !w.locked && w !== current);
  const locked = weeks.filter((w) => w.locked);
  const nextLesson = current?.lessons.find((l) => !l.done);
  const curDone = current ? current.lessons.filter((l) => l.done).length : 0;
  const curTotal = current ? current.lessons.length : 0;
  const allDone = allLessons.length > 0 && doneCount === allLessons.length;
  const caughtUp = !current && !allDone && locked.length > 0 && doneCount > 0;
  const nextUnlock = locked[0]?.unlocksAt;

  return (
    <PageBackdrop className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
      <header className="mb-6">
        <Eyebrow className="mb-1 block">Grow · The Liberated Path</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Eight weeks of ground taken
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <Progress
            value={allLessons.length ? (doneCount / allLessons.length) * 100 : 0}
            className="h-1.5 flex-1"
          />
          <span className="shrink-0 text-xs text-bone-2">
            {doneCount} of {allLessons.length} readings · {overallPct}%
          </span>
        </div>
      </header>

      {allDone && (
        <SectionCard hatch className="mb-6 border-gold-deep/60 p-5 sm:p-6">
          <Eyebrow tone="gold">The path, walked</Eyebrow>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-bone">
            Every reading, finished.
          </h2>
          <p className="mt-2 font-serif text-sm italic leading-relaxed text-bone-2">
            You've taken all the ground on the Liberated Path. Return to any week to sharpen what
            you've won.
          </p>
        </SectionCard>
      )}

      {caughtUp && (
        <SectionCard hatch className="mb-6 border-gold-deep/50 p-5 sm:p-6">
          <Eyebrow tone="gold">Caught up</Eyebrow>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-bone">
            You're current with the path.
          </h2>
          <p className="mt-2 font-serif text-sm italic leading-relaxed text-bone-2">
            You've taken all the ground available.
            {nextUnlock ? ` The next week unlocks ${nextUnlock}.` : " More unlocks soon."}
          </p>
        </SectionCard>
      )}

      {current && (
        <SectionCard hatch className="mb-6 border-gold-deep/60 p-5 sm:p-6">
          <div className="flex items-start gap-5">
            <span
              className="font-display text-6xl font-bold leading-none tracking-tight text-gold"
              aria-hidden="true"
            >
              {pad(current.number)}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <Eyebrow tone="gold">This week</Eyebrow>
              <h2 className="font-display text-2xl font-bold tracking-tight text-bone">
                {current.title}
              </h2>
              <p className="font-serif text-sm italic text-bone-2">{current.theme}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={curTotal ? (curDone / curTotal) * 100 : 0} className="h-1 flex-1" />
            <span className="shrink-0 text-xs text-bone-2">
              {curDone} of {curTotal} this week
            </span>
          </div>
          <ul className="mt-3">
            {current.lessons.map((l) => (
              <LessonRow
                key={l.id}
                weekLocked={false}
                lesson={l}
                isNext={l.id === nextLesson?.id}
              />
            ))}
          </ul>
          {nextLesson && (
            <Button asChild className="mt-3 w-full sm:w-auto">
              <Link to={`/app/grow/lesson/${nextLesson.id}`}>Continue: {nextLesson.title} →</Link>
            </Button>
          )}
        </SectionCard>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3">
            <Eyebrow>Ground already taken</Eyebrow>
          </h2>
          <Accordion type="multiple" className="mb-6 flex flex-col gap-2">
            {past.map((w) => (
              <AccordionItem
                key={w.id}
                value={w.id}
                className="rounded-lg border border-line bg-raised px-4"
              >
                <AccordionTrigger className="py-3.5 hover:no-underline">
                  <span className="flex items-center gap-4 text-left">
                    <span className="font-display text-2xl font-bold text-dim" aria-hidden="true">
                      {pad(w.number)}
                    </span>
                    <span>
                      <span className="block font-display text-base font-bold tracking-tight text-bone">
                        {w.title}
                      </span>
                      <span className="text-xs font-normal text-dim">
                        {w.lessons.filter((l) => l.done).length} of {w.lessons.length} finished
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul>
                    {w.lessons.map((l) => (
                      <LessonRow key={l.id} weekLocked={false} lesson={l} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}

      <h2 className="mb-3">
        <Eyebrow>The road ahead</Eyebrow>
      </h2>
      <ul className="flex flex-col gap-2">
        {locked.map((w) => (
          <li
            key={w.id}
            className="flex items-center gap-4 rounded-lg border border-line-soft bg-forge-2 px-4 py-3.5"
          >
            <span className="font-display text-2xl font-bold text-line" aria-hidden="true">
              {pad(w.number)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold tracking-tight text-dim">
                {w.title}
              </span>
              <span className="font-serif text-xs italic text-dim">{w.theme}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-dim">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {w.unlocksAt ? `Unlocks ${w.unlocksAt}` : "Unlocks in order"}
            </span>
          </li>
        ))}
      </ul>
    </PageBackdrop>
  );
};

export default Grow;
