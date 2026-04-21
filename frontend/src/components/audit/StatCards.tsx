import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Activity, Wallet, Gauge } from "lucide-react";
import { useThemeLang } from "./ThemeLangContext";
import { useAuditData } from "@/hooks/useAuditData";

export function StatCards() {
  const { t } = useThemeLang();
  const { stats } = useAuditData();
  const riskScore =
    stats.high_risk_count * 3 + stats.medium_risk_count * 2 + stats.low_risk_count;
  const cards = [
    {
      label: t.totalTx,
      value: stats.total_transactions_reviewed.toLocaleString(),
      delta: `${stats.total_events.toLocaleString()} events`,
      up: true,
      icon: Activity,
      accent: "text-foreground",
    },
    {
      label: t.anomDetected,
      value: stats.total_flagged.toLocaleString(),
      delta: `${stats.high_risk_count} high risk`,
      up: true,
      icon: AlertTriangle,
      accent: "text-primary",
    },
    {
      label: t.riskScore,
      value: stats.high_risk_count > 0 ? "High" : stats.medium_risk_count > 0 ? "Medium" : "Low",
      delta: `${riskScore} weighted`,
      up: stats.high_risk_count === 0,
      icon: Gauge,
      accent: "text-warning",
    },
    {
      label: t.finVolume,
      value: `₹ ${stats.total_volume.toLocaleString()}`,
      delta: `${stats.low_risk_count} low risk`,
      up: true,
      icon: Wallet,
      accent: "text-foreground",
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="h-8 w-8 grid place-items-center rounded-lg bg-secondary">
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className={`mt-3 text-3xl font-semibold tracking-tight ${c.accent}`}>{c.value}</div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {c.up ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className="text-muted-foreground">{c.delta}</span>
            <span className="text-muted-foreground/60">vs yesterday</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
