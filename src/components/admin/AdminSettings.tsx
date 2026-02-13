import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Setting saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure application settings</p>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle className="font-serif text-lg">Brotherhood</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Max brothers per user</Label>
            <div className="flex gap-2 mt-1">
              <Input type="number" value={maxBrothers} onChange={(e) => setMaxBrothers(e.target.value)} className="w-24" />
              <Button size="sm" onClick={() => saveSetting.mutate({ key: "max_brothers", value: parseInt(maxBrothers) || 5 })} disabled={saveSetting.isPending} className="gap-1.5">
                {saveSetting.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminSettings;
