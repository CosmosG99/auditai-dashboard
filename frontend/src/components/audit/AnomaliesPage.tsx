import { useState } from "react";
import { PageLayout } from "./PageLayout";
import { AnomalyFeed } from "./AnomalyFeed";
import { AnomalyDetail } from "./AnomalyDetail";
import { anomalies } from "@/lib/mock-data";
import { AlertCircle, TrendingUp, ShieldAlert, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuditData } from "@/hooks/useAuditData";

export function AnomaliesPage() {
  const [selected, setSelected] = useState(anomalies[0]);
  const { stats } = useAuditData();

  return (
    <PageLayout 
      title="Anomalies Detection" 
      subtitle="AI-detected irregularities requiring immediate attention."
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Critical Anomalies", value: String(stats.high_risk_count), icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "High Risk", value: String(stats.high_risk_count), icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Unusual Patterns", value: String(stats.medium_risk_count + stats.low_risk_count), icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Resolved Today", value: String(Math.max(0, stats.total_transactions_reviewed - stats.total_flagged)), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-xl border border-border/50 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-320px)] min-h-[600px]">
        <div className="xl:col-span-4 h-full overflow-hidden rounded-xl border border-border/50 bg-card/10 backdrop-blur">
          <AnomalyFeed selectedId={selected.id} onSelect={setSelected} />
        </div>
        <div className="xl:col-span-8 h-full overflow-y-auto pr-2 custom-scrollbar">
          <AnomalyDetail anomaly={selected} />
        </div>
      </div>
    </PageLayout>
  );
}
