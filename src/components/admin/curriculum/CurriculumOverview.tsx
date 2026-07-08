import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, Settings2, Calendar, ChevronRight, Pencil, Eye, EyeOff,
} from "lucide-react";
import {
  useCurriculumSettings, useSaveCurriculumSettings,
  useWeeks, useSaveWeek, usePublishWeek,
} from "@/hooks/useAdminCurriculumNew";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

const pad = (n: number) => String(n).padStart(2, "0");

const CurriculumOverview = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading: settingsLoading } = useCurriculumSettings();
  const { data: weeks, isLoading: weeksLoading } = useWeeks();
  const saveSettings = useSaveCurriculumSettings();
  const saveWeek = useSaveWeek();
  const publishWeek = usePublishWeek();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [weekDialog, setWeekDialog] = useState<any>(null);

  const openSettings = () => {
    if (settings) {
      setSettingsForm({ ...settings });
      setSettingsOpen(true);
    }
  };

  const handleSaveSettings = async () => {
    const { id, created_at, updated_at, ...rest } = settingsForm;
    await saveSettings.mutateAsync(rest);
    setSettingsOpen(false);
  };

  const handleSaveWeek = async () => {
    if (!weekDialog?.title) return;
    await saveWeek.mutateAsync(weekDialog);
    setWeekDialog(null);
  };

  if (settingsLoading || weeksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow className="mb-1 block">Curriculum</Eyebrow>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
            {settings?.title || "Curriculum"}
          </h1>
          <p className="mt-1 text-sm text-dim">{settings?.subtitle || "Manage your 8-week journey"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={settings?.status === "published" ? "default" : "secondary"} className="capitalize">
            {settings?.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={openSettings} className="gap-2">
            <Settings2 className="h-4 w-4" aria-hidden="true" /> Settings
          </Button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard className="p-5 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-gold" aria-hidden="true" />
          <p className="font-display text-2xl font-bold text-bone">{weeks?.length || 0}</p>
          <Eyebrow className="mt-0.5 block">Weeks</Eyebrow>
        </SectionCard>
        <SectionCard className="p-5 text-center">
          <Eye className="mx-auto mb-2 h-5 w-5 text-success" aria-hidden="true" />
          <p className="font-display text-2xl font-bold text-bone">{weeks?.filter(w => w.status === "published").length || 0}</p>
          <Eyebrow className="mt-0.5 block">Published</Eyebrow>
        </SectionCard>
        <SectionCard className="p-5 text-center">
          <EyeOff className="mx-auto mb-2 h-5 w-5 text-dim" aria-hidden="true" />
          <p className="font-display text-2xl font-bold text-bone">{weeks?.filter(w => w.status === "draft").length || 0}</p>
          <Eyebrow className="mt-0.5 block">Drafts</Eyebrow>
        </SectionCard>
      </div>

      {/* Drip Mode */}
      <SectionCard hatch className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Eyebrow className="mb-1 block">Drip mode</Eyebrow>
            <p className="text-sm text-dim">
              {settings?.drip_mode === "weekly"
                ? "Weeks unlock every 7 days after enrollment"
                : settings?.drip_mode === "immediate"
                ? "All content available immediately"
                : "Learners must complete prior lessons"}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 capitalize">{settings?.drip_mode}</Badge>
        </div>
      </SectionCard>

      {/* Weeks List */}
      <div>
        <Eyebrow className="mb-3 block">Weeks</Eyebrow>
        <div className="flex flex-col gap-2">
          {(weeks || []).map((week) => (
            <SectionCard
              key={week.id}
              className="cursor-pointer p-0 transition-colors hover:border-gold-deep hover:bg-raised-2"
              onClick={() => navigate(`/admin/curriculum/weeks/${week.id}`)}
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="font-display text-3xl font-bold leading-none tracking-tight text-gold" aria-hidden="true">
                    {pad(week.week_number)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold tracking-tight text-bone">{week.title}</h3>
                    <p className="truncate text-sm text-dim">{week.summary || "No summary"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-dim">Day {week.unlock_day_offset}</span>
                  <Badge variant={week.status === "published" ? "default" : "secondary"} className="capitalize">{week.status}</Badge>
                  <Button variant="ghost" size="icon" aria-label={`Edit week ${week.week_number}`} onClick={() => setWeekDialog({ ...week })}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={week.status === "published" ? "Unpublish week" : "Publish week"}
                    onClick={() => publishWeek.mutate({ id: week.id, publish: week.status !== "published" })}
                  >
                    {week.status === "published" ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-dim" aria-hidden="true" />
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={(o) => !o && setSettingsOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold tracking-tight">Curriculum Settings</DialogTitle>
          </DialogHeader>
          {settingsForm && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={settingsForm.title} onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea value={settingsForm.subtitle || ""} onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Duration Label</Label>
                <Input value={settingsForm.duration_label || ""} onChange={(e) => setSettingsForm({ ...settingsForm, duration_label: e.target.value })} />
              </div>
              <div>
                <Label>Drip Mode</Label>
                <Select value={settingsForm.drip_mode} onValueChange={(v) => setSettingsForm({ ...settingsForm, drip_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Drip</SelectItem>
                    <SelectItem value="immediate">Immediate Access</SelectItem>
                    <SelectItem value="sequential">Sequential (Complete to Unlock)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={settingsForm.status} onValueChange={(v) => setSettingsForm({ ...settingsForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={saveSettings.isPending}>
              {saveSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Week Edit Dialog */}
      <Dialog open={!!weekDialog} onOpenChange={(o) => !o && setWeekDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold tracking-tight">Edit Week</DialogTitle>
          </DialogHeader>
          {weekDialog && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={weekDialog.title} onChange={(e) => setWeekDialog({ ...weekDialog, title: e.target.value })} />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea value={weekDialog.summary || ""} onChange={(e) => setWeekDialog({ ...weekDialog, summary: e.target.value })} />
              </div>
              <div>
                <Label>Unlock Day Offset</Label>
                <Input type="number" value={weekDialog.unlock_day_offset} onChange={(e) => setWeekDialog({ ...weekDialog, unlock_day_offset: parseInt(e.target.value) || 0 })} />
                <p className="mt-1 text-xs text-dim">Days after enrollment this week becomes available</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeekDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveWeek} disabled={saveWeek.isPending}>
              {saveWeek.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumOverview;
