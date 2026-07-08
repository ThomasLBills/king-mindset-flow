import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Check, HandHeart, RefreshCcw, Sun } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAddDeclaration, useCompleteRhythm, useRhythms, useVerseOfDay } from "@/mock/hooks";
import type { RhythmKind } from "@/mock/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoldButton } from "@/components/forge/HoldButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

const PRAYER_STEPS = [
  { lead: "Be still", line: "Father, I'm here. Slow me down." },
  { lead: "Hand it over", line: "Name today's weight out loud, and set it down." },
  { lead: "Ask", line: "Strength for the fight. Eyes for the good. A guarded heart." },
  { lead: "Receive", line: "Your grace is enough for today. Amen." },
];

const PrayerDialog = ({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
          Morning prayer
        </DialogTitle>
        <DialogDescription>Four movements. Take them slowly.</DialogDescription>
      </DialogHeader>
      <ol className="my-2 flex flex-col gap-4">
        {PRAYER_STEPS.map((s, i) => (
          <li key={s.lead} className="flex gap-3.5">
            <span className="font-display text-xs font-bold text-gold" aria-hidden="true">
              {["I", "II", "III", "IV"][i]}
            </span>
            <span>
              <b className="block text-sm font-semibold text-bone">{s.lead}</b>
              <span className="font-serif text-sm italic text-bone-2">{s.line}</span>
            </span>
          </li>
        ))}
      </ol>
      <Button onClick={onDone} className="w-full">
        Amen
      </Button>
    </DialogContent>
  </Dialog>
);

const ScriptureDialog = ({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) => {
  const { data: verse } = useVerseOfDay();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Today's word
          </DialogTitle>
          <DialogDescription>Read it twice. Once for the head, once for the heart.</DialogDescription>
        </DialogHeader>
        {verse && (
          <blockquote className="my-2">
            <p className="font-serif text-xl italic leading-relaxed text-bone">“{verse.text}”</p>
            <footer className="mt-3">
              <Eyebrow tone="gold">{verse.ref}</Eyebrow>
            </footer>
          </blockquote>
        )}
        <Button onClick={onDone} className="w-full">
          Word received
        </Button>
        <p className="text-center text-[10px] text-dim">
          Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.
        </p>
      </DialogContent>
    </Dialog>
  );
};

const reframeSchema = z.object({
  lie: z.string().min(3, "Name the thought, even roughly."),
  truth: z.string().min(3, "Answer it with what's true."),
});

const RenewedMindDialog = ({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) => {
  const addDeclaration = useAddDeclaration();
  const form = useForm<z.infer<typeof reframeSchema>>({
    resolver: zodResolver(reframeSchema),
    defaultValues: { lie: "", truth: "" },
  });

  // A reopened dialog must not open already scolding with old validation errors.
  useEffect(() => {
    if (open) form.reset({ lie: "", truth: "" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Renew the mind
          </DialogTitle>
          <DialogDescription>
            Catch one lie that's been running today. Answer it in writing.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(({ truth }) => {
              // The truth you wrote becomes yours to keep — it resurfaces
              // under "Stand on the Word" in Stand Firm.
              addDeclaration.mutate(truth);
              onDone();
              form.reset();
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="lie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>The lie</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder={'e.g. "One look won\'t matter"'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="truth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>The truth</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={'e.g. "It always matters. And I\'m not trading my freedom for it."'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <HoldButton
              onComplete={() =>
                form.handleSubmit(({ truth }) => {
                  addDeclaration.mutate(truth);
                  onDone();
                  form.reset();
                })()
              }
            >
              Hold to declare it
            </HoldButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const gratitudeSchema = z.object({
  first: z.string().min(1, "Name one thing."),
  second: z.string().min(1, "And a second."),
  third: z.string().min(1, "One more. There's always a third."),
});

const GratitudeDialog = ({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) => {
  const form = useForm<z.infer<typeof gratitudeSchema>>({
    resolver: zodResolver(gratitudeSchema),
    defaultValues: { first: "", second: "", third: "" },
  });

  useEffect(() => {
    if (open) form.reset({ first: "", second: "", third: "" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Gratitude
          </DialogTitle>
          <DialogDescription>
            Three things, today. See what God is already doing.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => {
              onDone();
              form.reset();
            })}
            className="space-y-4"
          >
            {(["first", "second", "third"] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="I'm grateful for…" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" className="w-full">
              Complete gratitude
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const RHYTHM_CARDS: {
  kind: RhythmKind;
  icon: typeof HandHeart;
  title: string;
  sub: string;
  cta: string;
}[] = [
  {
    kind: "prayer",
    icon: HandHeart,
    title: "Prayer",
    sub: "Four movements to start the day surrendered.",
    cta: "Pray now",
  },
  {
    kind: "scripture",
    icon: BookOpen,
    title: "Scripture",
    sub: "One verse, read slowly. The day's anchor.",
    cta: "Read today's word",
  },
  {
    kind: "renewedMind",
    icon: RefreshCcw,
    title: "Renewed mind",
    sub: "Catch one lie. Answer it with truth.",
    cta: "Renew now",
  },
  {
    kind: "gratitude",
    icon: Sun,
    title: "Gratitude",
    sub: "Three things. See what God is already doing.",
    cta: "Give thanks",
  },
];

const Rhythms = () => {
  const { data: rhythms } = useRhythms();
  const complete = useCompleteRhythm();
  const [openKind, setOpenKind] = useState<RhythmKind | null>(null);

  const done = (kind: RhythmKind, message: string) => {
    complete.mutate(kind, { onSuccess: () => toast.success(message) });
    setOpenKind(null);
  };

  if (!rhythms) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const doneCount = Object.values(rhythms).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
      <header className="mb-6">
        <Eyebrow className="mb-1 block">Daily rhythms</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          The ordinary days
        </h1>
        <p className="mt-2 max-w-[52ch] font-serif italic text-bone-2">
          Freedom isn't won on the hard days. It's built on days like this one. {doneCount} of 4
          kept so far.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {RHYTHM_CARDS.map(({ kind, icon: Icon, title, sub, cta }) => {
          const isDone = rhythms[kind];
          return (
            <SectionCard key={kind} className={cn("p-5", isDone && "border-gold-deep/50")}>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-md border",
                    isDone ? "border-gold-deep bg-[hsl(38_45%_9%)] text-gold" : "border-line text-dim"
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold tracking-tight text-bone">{title}</h2>
                  <p className="text-sm text-bone-2">{sub}</p>
                </div>
                {isDone ? (
                  <p className="flex shrink-0 items-center gap-1.5 text-sm text-gold">
                    <Check className="h-4 w-4" aria-hidden="true" /> Kept
                  </p>
                ) : (
                  <Button variant="outline" className="shrink-0" onClick={() => setOpenKind(kind)}>
                    {cta}
                  </Button>
                )}
              </div>
            </SectionCard>
          );
        })}
      </div>

      <PrayerDialog
        open={openKind === "prayer"}
        onOpenChange={(o) => !o && setOpenKind(null)}
        onDone={() => done("prayer", "Prayer kept. Walk in it.")}
      />
      <ScriptureDialog
        open={openKind === "scripture"}
        onOpenChange={(o) => !o && setOpenKind(null)}
        onDone={() => done("scripture", "Word received. Hold it all day.")}
      />
      <RenewedMindDialog
        open={openKind === "renewedMind"}
        onOpenChange={(o) => !o && setOpenKind(null)}
        onDone={() => done("renewedMind", "Lie answered and kept. It'll fight for you in Stand Firm.")}
      />
      <GratitudeDialog
        open={openKind === "gratitude"}
        onOpenChange={(o) => !o && setOpenKind(null)}
        onDone={() => done("gratitude", "Gratitude recorded. Eyes trained on grace.")}
      />
    </div>
  );
};

export default Rhythms;
