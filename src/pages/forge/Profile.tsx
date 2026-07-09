import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, LogOut, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { FEATURES } from "@/features";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useForgeUser, useUpdateForgeProfile } from "@/hooks/useForgeProfile";
import { useCovenant, useSetWhy } from "@/hooks/useCovenant";
import { WEEKLY_CALL } from "@/data/weeklyCall";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { Eyebrow, InitialsAvatar, SectionCard } from "@/components/forge/atoms";
import { LkSeal } from "@/components/forge/brand";

const VOWS = [
  "I will not fight alone.",
  "I will tell the truth, especially the truth I want to hide.",
  "When I fall, I will return quickly, without hiding.",
  "I will turn to Christ first, not last.",
  "I will guard the people entrusted to me.",
  "I will show up on the ordinary days, not only the hard ones.",
];

const whySchema = z.object({
  why: z.string().min(3, "One honest sentence.").max(140, "Short enough to remember under fire"),
});

const infoSchema = z.object({
  name: z.string().min(2, "Your name, brother"),
  phone: z.string().optional(),
  timezone: z.string(),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

const TIMEZONES = ["Eastern", "Central", "Mountain", "Pacific"] as const;

const PREFS = [
  { key: "reminder", label: "Daily rhythm reminder", sub: "One quiet nudge each morning." },
  { key: "discretion", label: "Discretion mode", sub: "Neutral tab title and icon in your browser." },
  { key: "call", label: "Weekly call reminder", sub: `A heads-up before ${WEEKLY_CALL.label}.` },
] as const;

/**
 * There is no notification backend yet, so these toggles are honest
 * client-side preferences persisted to localStorage.
 */
const PREFS_STORAGE_KEY = "lk-prefs-v1";

const DEFAULT_PREFS: Record<string, boolean> = {
  reminder: true,
  discretion: false,
  call: true,
};

const loadPrefs = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useForgeUser();
  const updateProfile = useUpdateForgeProfile();
  const { data: covenant } = useCovenant();
  const setWhy = useSetWhy();
  const navigate = useNavigate();
  const [whyOpen, setWhyOpen] = useState(false);
  const [vowsOpen, setVowsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(loadPrefs);

  const why = covenant?.why ?? null;
  const sealed = FEATURES.covenant && covenant && covenant.signed_name;

  const whyForm = useForm<z.infer<typeof whySchema>>({
    resolver: zodResolver(whySchema),
    defaultValues: { why: why ?? "" },
  });

  const infoForm = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      timezone: user?.timezone ?? "Central",
    },
  });

  // Profile data arrives async; hydrate the form when it lands (and after saves).
  useEffect(() => {
    if (!user) return;
    infoForm.reset({
      name: user.name,
      phone: user.phone ?? "",
      timezone:
        user.timezone && (TIMEZONES as readonly string[]).includes(user.timezone)
          ? user.timezone
          : "Central",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.phone, user?.timezone]);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const setPref = (key: string, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode) - keep the in-memory toggle.
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch {
      toast.error("Couldn't sign out. Try again.");
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
      <header className="mb-6">
        <Eyebrow className="mb-1 block">Profile</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          The man in the fight
        </h1>
      </header>

      <div className="flex flex-col gap-4">
        <SectionCard className="p-5">
          <div className="flex items-center gap-4">
            <InitialsAvatar initials={user?.initials ?? "LK"} className="h-14 w-14 text-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-bold tracking-tight text-bone">{user?.name}</p>
              <p className="text-sm text-dim">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" disabled={signingOut} onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </Button>
          </div>
        </SectionCard>

        {sealed && (
          <SectionCard hatch className="border-gold-deep/60 p-5">
            <div className="flex items-start gap-4">
              <LkSeal className="h-14 w-14 shrink-0 text-gold opacity-80" />
              <div className="min-w-0 flex-1">
                <Eyebrow tone="gold">The Covenant</Eyebrow>
                <p className="mt-1 font-script text-3xl text-gold-bright">{covenant.signed_name}</p>
                {covenant.signed_at && (
                  <p className="mt-1 text-xs text-dim">
                    Sealed {format(new Date(covenant.signed_at), "d MMMM yyyy")}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setVowsOpen(true)}>
                <ScrollText className="h-4 w-4" aria-hidden="true" /> Re-read
              </Button>
            </div>
          </SectionCard>
        )}

        {FEATURES.rememberWhy && (
          <SectionCard className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Eyebrow className="mb-1.5 block">Your why</Eyebrow>
                {why ? (
                  <p className="font-serif text-lg italic text-bone">“{why}”</p>
                ) : (
                  <p className="text-sm text-bone-2">
                    Not written yet. On a hard night, this is the first thing we hand back to you.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  whyForm.reset({ why: why ?? "" });
                  setWhyOpen(true);
                }}
              >
                {why ? "Edit" : "Write it"}
              </Button>
            </div>
          </SectionCard>
        )}

        <SectionCard className="p-5">
          <Eyebrow className="mb-3 block">Preferences</Eyebrow>
          <div className="flex flex-col">
            {PREFS.map((p, i) => (
              <div
                key={p.key}
                className={`flex items-center gap-4 py-3 ${i > 0 ? "border-t border-line-soft" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`pref-${p.key}`} className="text-sm font-semibold text-bone">
                    {p.label}
                  </Label>
                  <p className="text-xs text-dim">{p.sub}</p>
                </div>
                <Switch
                  id={`pref-${p.key}`}
                  checked={prefs[p.key]}
                  onCheckedChange={(v) => {
                    setPref(p.key, v);
                    toast.success(`${p.label} ${v ? "on" : "off"}.`);
                  }}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <Eyebrow className="mb-4 block">Personal info</Eyebrow>
          <Form {...infoForm}>
            <form
              onSubmit={infoForm.handleSubmit((values) => {
                updateProfile.mutate(values, {
                  onSuccess: () => toast.success("Saved."),
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Couldn't save. Try again."),
                });
              })}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={user?.email ?? ""} disabled readOnly />
              </div>
              <FormField
                control={infoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-4 sm:flex-row">
                <FormField
                  control={infoForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="tel" placeholder="(555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={infoForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" variant="outline" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </Form>
        </SectionCard>

        <SectionCard className="p-5">
          <Eyebrow className="mb-4 block">Security</Eyebrow>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(async ({ password }) => {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                passwordForm.reset();
                toast.success("Password updated.");
              })}
              className="space-y-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          </Form>
        </SectionCard>

        <SectionCard className="p-0">
          <Link
            to="/app/billing"
            className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-bone transition-colors hover:bg-raised-2"
          >
            Membership & billing
            <ChevronRight className="h-4 w-4 text-dim" aria-hidden="true" />
          </Link>
          <Link
            to="/app/rhythms"
            className="flex items-center justify-between border-t border-line-soft px-5 py-4 text-sm font-semibold text-bone transition-colors hover:bg-raised-2"
          >
            Daily rhythms
            <ChevronRight className="h-4 w-4 text-dim" aria-hidden="true" />
          </Link>
        </SectionCard>
      </div>

      <Dialog open={whyOpen} onOpenChange={setWhyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
              Your why
            </DialogTitle>
            <DialogDescription>One sentence you'd stand on at 1 AM.</DialogDescription>
          </DialogHeader>
          <Form {...whyForm}>
            <form
              onSubmit={whyForm.handleSubmit(({ why: next }) => {
                setWhy.mutate(next, {
                  onSuccess: () => {
                    setWhyOpen(false);
                    toast.success("Kept. It'll be there when you need it.");
                  },
                  onError: () => toast.error("Couldn't save it. Check your connection and try again."),
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={whyForm.control}
                name="why"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea rows={3} className="font-serif text-lg italic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={setWhy.isPending}>
                {setWhy.isPending ? "Keeping…" : "Keep it"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={vowsOpen} onOpenChange={setVowsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-3xl font-semibold">
              The Covenant
            </DialogTitle>
            <DialogDescription className="text-center font-serif italic">
              Sworn {covenant?.signed_at ? format(new Date(covenant.signed_at), "d MMMM yyyy") : ""}.
              Still standing.
            </DialogDescription>
          </DialogHeader>
          <ol className="my-2 flex flex-col gap-3.5">
            {VOWS.map((vow, i) => (
              <li key={i} className="flex items-baseline gap-3.5">
                <span className="w-6 shrink-0 font-display text-xs font-bold text-gold" aria-hidden="true">
                  {["I", "II", "III", "IV", "V", "VI"][i]}
                </span>
                <p className="font-serif text-lg leading-snug text-bone">{vow}</p>
              </li>
            ))}
          </ol>
          <p className="text-center font-script text-2xl text-gold-bright">{covenant?.signed_name}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
