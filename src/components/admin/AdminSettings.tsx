import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { logAdminAudit } from "@/lib/adminAudit";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

const AdminSettings = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [maxBrothers, setMaxBrothers] = useState("5");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (settings) {
      const mb = settings.find((s) => s.key === "max_brothers");
      if (mb) setMaxBrothers(String((mb.value as any) || 5));
    }
  }, [settings]);

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
      await logAdminAudit({ action: "update", entityType: "app_settings", entityId: key, after: { value } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Setting saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow className="mb-1 block">Admin</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Settings
        </h1>
        <p className="mt-1 text-sm text-dim">Configure how the app runs.</p>
      </header>

      <SectionCard className="p-5">
        <Eyebrow className="mb-4 block">Brotherhood</Eyebrow>
        <div className="space-y-2">
          <Label htmlFor="max-brothers">Max brothers per user</Label>
          <div className="flex gap-2">
            <Input
              id="max-brothers"
              type="number"
              value={maxBrothers}
              onChange={(e) => setMaxBrothers(e.target.value)}
              className="w-24"
            />
            <Button
              size="sm"
              onClick={() => saveSetting.mutate({ key: "max_brothers", value: parseInt(maxBrothers) || 5 })}
              disabled={saveSetting.isPending}
            >
              {saveSetting.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminSettings;
