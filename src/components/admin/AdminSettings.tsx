import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { ErrorState } from "@/components/feedback";
import { logAdminAudit } from "@/lib/adminAudit";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

const AdminSettings = () => {
  const qc = useQueryClient();
  const [maxBrothers, setMaxBrothers] = useState("5");

  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
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
    // Failure surfaces via the global mutation-error net (mapSupabaseError toast).
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      notify.success("Setting saved");
    },
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );

  if (isError)
    return (
      <ErrorState
        title="Couldn't load settings"
        message="Something went wrong fetching the app settings."
        onRetry={() => refetch()}
      />
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
