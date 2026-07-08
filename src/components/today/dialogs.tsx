import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompleteCheckIn, useCompleteReflection } from "@/mock/hooks";

const checkInSchema = z.object({
  mood: z.enum(["strong", "steady", "shaky"], { required_error: "How are you arriving?" }),
  sleep: z.enum(["well", "poorly"], { required_error: "How did you sleep?" }),
  note: z.string().max(280, "Keep it under 280 characters").optional(),
});

/** Every emotional prompt gets a cited verse — house rule from the original app. */
const MOOD_VERSES: Record<z.infer<typeof checkInSchema>["mood"], { ref: string; text: string }> = {
  strong: {
    ref: "1 Corinthians 16:13",
    text: "Be watchful, stand firm in the faith, act like men, be strong.",
  },
  steady: {
    ref: "Psalm 16:8",
    text: "I have set the LORD always before me; because he is at my right hand, I shall not be shaken.",
  },
  shaky: {
    ref: "Psalm 34:18",
    text: "The LORD is near to the brokenhearted and saves the crushed in spirit.",
  },
};

type CheckInValues = z.infer<typeof checkInSchema>;

const optionCard = (checked: boolean) =>
  cn(
    "flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm font-medium transition-colors",
    checked
      ? "border-gold-deep bg-raised-2 text-gold-bright"
      : "border-line bg-raised text-bone-2 hover:border-gold-deep/50"
  );

export const CheckInDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const mutation = useCompleteCheckIn();
  const form = useForm<CheckInValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: { note: "" },
  });

  // A reopened dialog must not carry stale input or old validation errors.
  useEffect(() => {
    if (open) form.reset({ note: "" });
  }, [open, form]);

  const onSubmit = (values: CheckInValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("Checked in. Good to see you, brother.");
        onOpenChange(false);
        form.reset({ note: "" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Morning check-in
          </DialogTitle>
          <DialogDescription>
            Thirty honest seconds. That's the whole discipline.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How are you arriving today?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      className="flex gap-2"
                    >
                      {(["strong", "steady", "shaky"] as const).map((mood) => (
                        <FormItem key={mood} className="flex-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={mood} className="sr-only" />
                          </FormControl>
                          <FormLabel className={optionCard(field.value === mood)}>
                            {mood.charAt(0).toUpperCase() + mood.slice(1)}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <p className="rounded-md border border-line bg-raised px-4 py-3 font-serif text-sm italic leading-relaxed text-bone">
                      “{MOOD_VERSES[field.value].text}”
                      <span className="mt-1.5 block font-display text-[10px] not-italic tracking-[0.14em] text-gold">
                        {MOOD_VERSES[field.value].ref.toUpperCase()}
                      </span>
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sleep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sleep?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      className="flex gap-2"
                    >
                      {(
                        [
                          { value: "well", label: "Slept well" },
                          { value: "poorly", label: "Rough night" },
                        ] as const
                      ).map(({ value, label }) => (
                        <FormItem key={value} className="flex-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={value} className="sr-only" />
                          </FormControl>
                          <FormLabel className={optionCard(field.value === value)}>{label}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you sense the Spirit saying about what you're feeling? (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Name it and it loses weight…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Logging…" : "Log check-in"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const reflectionSchema = z.object({
  reflection: z.string().min(3, "A sentence is enough, but write something.").max(1000),
});

type ReflectionValues = z.infer<typeof reflectionSchema>;

export const ReflectionDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const mutation = useCompleteReflection();
  const form = useForm<ReflectionValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: { reflection: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reflection: "" });
  }, [open, form]);

  const onSubmit = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Reflection kept. Rest well.");
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Evening reflection
          </DialogTitle>
          <DialogDescription>Where did you see God hold you today?</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="reflection"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={5} placeholder="Tonight I noticed…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Keeping…" : "Keep this reflection"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
