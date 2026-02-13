import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScrollText } from "lucide-react";
import { useAuditLog } from "@/hooks/useAdminCurriculum";
import { motion } from "framer-motion";

const actionColors: Record<string, string> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  publish: "default",
  unpublish: "outline",
  reorder: "secondary",
  duplicate: "outline",
};

const AdminAuditLog = () => {
  const { data: logs, isLoading } = useAuditLog(100);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Track all admin actions</p>
      </div>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !logs?.length ? (
            <div className="text-center py-12">
              <ScrollText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No audit entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={actionColors[log.action] as any} className="capitalize">{log.action}</Badge>
                      <span className="text-sm font-medium capitalize">{log.entity_type}</span>
                      {log.entity_id && <span className="text-xs font-mono text-muted-foreground">{log.entity_id.slice(0, 8)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()} · Admin: {log.admin_user_id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminAuditLog;
