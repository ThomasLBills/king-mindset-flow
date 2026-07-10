import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

export type LessonCompleteProps = {
  weekNumber?: number;
  weekTitle?: string;
  weekDone: number;
  weekTotal: number;
  overallDone: number;
  overallTotal: number;
  /** First incomplete unlocked lesson after this one, if any. */
  next?: { id: string; title: string };
  /** Date label when the next ground is still locked (only when `next` is absent). */
  nextUnlocksAt?: string;
};

const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

/**
 * The earned-honor panel shown after a reading is finished. Reflects live
 * progress toward the week and the whole path, and makes the next step the
 * obvious move. Escalates its language for finishing a week / the whole path;
 * the confetti burst itself is fired by Lesson.tsx at the moment of completion.
 */
export const LessonComplete = ({
  weekNumber,
  weekTitle,
  weekDone,
  weekTotal,
  overallDone,
  overallTotal,
  next,
  nextUnlocksAt,
}: LessonCompleteProps) => {
  const journeyComplete = overallTotal > 0 && overallDone >= overallTotal;
  const weekComplete = weekTotal > 0 && weekDone >= weekTotal;

  let eyebrow: string;
  let headline: string;
  let subline: string;
  if (journeyComplete) {
    eyebrow = "The path, walked";
    headline = "Every reading, finished.";
    subline =
      "You've taken all the ground on the Liberated Path. This isn't the end of the work. It's proof you can hold the line.";
  } else if (weekComplete) {
    eyebrow = weekNumber ? `Week ${weekNumber} complete` : "Week complete";
    headline = "The week is finished.";
    subline = weekTitle
      ? `You held the line all the way through ${weekTitle}. Carry that momentum forward.`
      : "You held the line all week. Carry that momentum forward.";
  } else {
    eyebrow = "Reading finished";
    headline = "Ground taken.";
    subline = "Let it settle. When you're ready, take the next step.";
  }

  return (
    <SectionCard
      hatch
      className="mt-10 border-gold-deep/60 p-6 sm:p-7 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
    >
      <span
        className="grid h-11 w-11 place-items-center rounded-full border border-gold-deep bg-[hsl(38_45%_9%)] text-gold"
        aria-hidden="true"
      >
        <Check className="h-5 w-5" />
      </span>

      <Eyebrow tone="gold" className="mt-4 block">
        {eyebrow}
      </Eyebrow>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-bone">{headline}</h2>
      <p className="mt-2 font-serif text-base italic leading-relaxed text-bone-2">{subline}</p>

      <div className="mt-5 space-y-3">
        {weekTotal > 0 && !journeyComplete && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-dim">{weekNumber ? `Week ${weekNumber}` : "This week"}</span>
              <span className="text-bone-2">
                {weekDone} of {weekTotal} taken
              </span>
            </div>
            <Progress value={pct(weekDone, weekTotal)} className="h-1.5" />
          </div>
        )}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-dim">The whole path</span>
            <span className="text-bone-2">
              {overallDone} of {overallTotal} readings
            </span>
          </div>
          <Progress value={pct(overallDone, overallTotal)} className="h-1.5" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {next ? (
          <Button asChild>
            <Link to={`/app/grow/lesson/${next.id}`}>Continue: {next.title} →</Link>
          </Button>
        ) : journeyComplete ? (
          <Button asChild>
            <Link to="/app/grow">Return to the path</Link>
          </Button>
        ) : nextUnlocksAt ? (
          <>
            <p className="text-sm text-bone-2">The next ground unlocks {nextUnlocksAt}.</p>
            <Button asChild variant="outline" className="sm:ml-auto">
              <Link to="/app/grow">Back to the path</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="outline">
            <Link to="/app/grow">Back to the path</Link>
          </Button>
        )}
      </div>
    </SectionCard>
  );
};

export default LessonComplete;
