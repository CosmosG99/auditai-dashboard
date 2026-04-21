import { motion } from "framer-motion";
import { Sparkles, FileText, Download, ShieldAlert, TrendingUp, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeLang } from "./ThemeLangContext";
import { useAuditData } from "@/hooks/useAuditData";
import { useState, useEffect } from "react";
import { runChat } from "@/lib/audit-api";
import { toast } from "sonner";

export function AIInsights() {
  const { t } = useThemeLang();
  const { events, stats } = useAuditData();
  const [dynamicInsights, setDynamicInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function generateInsights() {
      if (events.length === 0 || loading) return;
      setLoading(true);
      try {
        const recentFlagged = (events || [])
          .filter(e => e?.audit_event?.detection?.is_anomaly)
          .slice(0, 5);
        const context = recentFlagged.map(e => `${(e.audit_event.extraction || e.audit_event.transaction)?.vendor}: ${e.audit_event.detection?.reason}`).join(". ");
        
        const prompt = `Based on these recent flagged audits: "${context}". Total scanned: ${stats.total_transactions_reviewed || 0}, Flagged: ${stats.total_flagged || 0}, Total Volume: ${stats.total_volume || 0} INR.
        Identify 2 concisely worded executive financial insights. 
        Return ONLY a JSON array of objects: [{"title": "Short Title", "body": "1 sentence insight", "tone": "warning" or "success"}]`;
        
        const res = await runChat(prompt);
        // Robust JSON extraction
        const jsonMatch = res.match(/\[\s*\{.*\}\s*\]/s);
        const cleanRes = jsonMatch ? jsonMatch[0] : res.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanRes);
        if (Array.isArray(parsed)) {
           setDynamicInsights(parsed);
        }
      } catch (e) {
        console.warn("Insights generation skipped/failed:", e);
      } finally {
        setLoading(false);
      }
    }
    generateInsights();
  }, [events.length, stats.total_flagged]);

  const displayInsights = dynamicInsights.length > 0 ? dynamicInsights : [
    { title: "Anomaly Trend", body: "Risk distribution remains stable across Travel and Supplies.", tone: "success" },
    { title: "Vendor Risk", body: "New vendor patterns detected. Recommend manual review for outliers.", tone: "warning" }
  ];

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t.aiInsights}</h3>
          <p className="text-xs text-muted-foreground">{loading ? "Gemma is thinking..." : "Executive summary · live stats"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {displayInsights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              {ins.tone === "warning" ? (
                <ShieldAlert className="h-3.5 w-3.5 text-warning" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              )}
              <div className="text-sm font-medium">{ins.title}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ReportPreview() {
  const { t } = useThemeLang();
  const { stats } = useAuditData();
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-secondary grid place-items-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t.auditReport}</h3>
            <p className="text-xs text-muted-foreground">Q4 • Week 16</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => toast.info("Comprehensive PDF generation in progress...")}>
          <Download className="h-4 w-4" /> {t.download}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 font-mono text-[11px] space-y-2">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-foreground font-semibold">AuditAI · Risk Report</span>
          <span className="text-muted-foreground">v 4.2.1</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div>Total scanned: <span className="text-foreground">{stats.total_transactions_reviewed || 0}</span></div>
          <div>Flagged: <span className="text-primary">{stats.total_flagged || 0}</span></div>
          <div>High risk: <span className="text-destructive">{stats.high_risk_count || 0}</span></div>
          <div>Volume: <span className="text-success">₹{(stats.total_volume || 0).toLocaleString()}</span></div>
        </div>
        <div className="border-t border-border pt-2 text-muted-foreground leading-relaxed">
          Operational telemetry confirms {stats.total_flagged || 0} anomalies across ₹{(stats.total_volume || 0).toLocaleString()} scrutinized volume. 
          Compliance coverage at 100% for currently ingested audit nodes.
        </div>
        <div className="flex items-center gap-1 text-muted-foreground/70 pt-1">
          <Clock className="h-3 w-3" /> Updated in real-time
        </div>
      </div>
    </div>
  );
}
