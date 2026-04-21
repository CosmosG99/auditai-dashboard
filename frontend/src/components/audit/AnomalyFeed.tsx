import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { anomalies, type Anomaly, type RiskLevel } from "@/lib/mock-data";
import { useThemeLang } from "./ThemeLangContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

const riskColor: Record<RiskLevel, string> = {
  Low: "bg-success/15 text-success border-success/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  High: "bg-destructive/15 text-destructive border-destructive/30",
};

const riskWeight: Record<RiskLevel, number> = { Low: 1, Medium: 2, High: 3 };

export function AnomalyFeed({
  anomalies,
  selectedId,
  onSelect,
}: {
  anomalies: Anomaly[];
  selectedId: string;
  onSelect: (a: Anomaly) => void;
}) {
  const { t } = useThemeLang();
  const [minRisk, setMinRisk] = useState<number>(1);

  const filtered = (anomalies || []).filter((a) => a && riskWeight[a.risk] >= minRisk);

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
            <AlertTriangle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t.liveFeed}</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} flagged events</p>
          </div>
        </div>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>{t.risk} filter</span>
          <span>{["All", "Medium+", "High only"][minRisk - 1]}</span>
        </div>
        <Slider value={[minRisk]} onValueChange={(v) => setMinRisk(v[0])} min={1} max={3} step={1} />
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin -mx-1 pr-1">
        <ul className="space-y-2">
          {filtered.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => onSelect(a)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all group",
                  selectedId === a.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-secondary/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", riskColor[a.risk])}>
                      {a.risk}
                    </Badge>
                  </div>
                  <div className="font-semibold text-sm">₹ {a.amount.toLocaleString()}</div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{a.reason}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex gap-1">
                    {a.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-secondary border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {a.timestamp}
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
