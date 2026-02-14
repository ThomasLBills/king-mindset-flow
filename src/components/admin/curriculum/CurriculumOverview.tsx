import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { motion } from "framer-motion";

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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{settings?.title || "Curriculum"}</h1>
          <p className="text-sm text-muted-foreground">{settings?.subtitle || "Manage your 8-week journey"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings?.status === "published" ? "default" : "secondary"}>
            {settings?.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={openSettings} className="gap-2">
            <Settings2 className="h-4 w-4" /> Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{weeks?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Weeks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Eye className="h-5 w-5 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{weeks?.filter(w => w.status === "published").length || 0}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <EyeOff className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{weeks?.filter(w => w.status === "draft").length || 0}</p>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* Drip Mode */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Drip Mode</p>
              <p className="text-xs text-muted-foreground">
                {settings?.drip_mode === "weekly"
                  ? "Weeks unlock every 7 days after enrollment"
                  : settings?.drip_mode === "immediate"
                  ? "All content available immediately"
                  : "Learners must complete prior lessons"}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">{settings?.drip_mode}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Weeks List */}
      <div>
        <h2 className="font-serif text-lg font-semibold mb-3">Weeks</h2>
        <div className="space-y-2">
          {(weeks || []).map((week, i) => (
            <Card
              key={week.id}
              className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/curriculum/weeks/${week.id}`)}
            >
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {week.week_number}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-semibold truncate">{week.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{week.summary || "No summary"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground">Day {week.unlock_day_offset}</span>
                  <Badge variant={week.status === "published" ? "default" : "secondary"}>{week.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => setWeekDialog({ ...week })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => publishWeek.mutate({ id: week.id, publish: week.status !== "published" })}
                  >
                    {week.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={(o) => !o && setSettingsOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Curriculum Settings</DialogTitle>
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
              {saveSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Week Edit Dialog */}
      <Dialog open={!!weekDialog} onOpenChange={(o) => !o && setWeekDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Week</DialogTitle>
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
                <p className="text-xs text-muted-foreground mt-1">Days after enrollment this week becomes available</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeekDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveWeek} disabled={saveWeek.isPending}>
              {saveWeek.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CurriculumOverview;
