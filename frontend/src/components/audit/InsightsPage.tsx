import { PageLayout } from "./PageLayout";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const riskTrends = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 68 },
  { month: "Mar", score: 74 },
  { month: "Apr", score: 65 },
  { month: "May", score: 58 },
  { month: "Jun", score: 52 },
  { month: "Jul", score: 48 },
  { month: "Aug", score: 55 },
  { month: "Sep", score: 42 },
  { month: "Oct", score: 38 },
  { month: "Nov", score: 35 },
  { month: "Dec", score: 31 },
];

const aiPredictions = [
  {
    title: "Vendor Payment Anomaly Cluster",
    description: "AI detected a 3-sigma deviation in vendor payments to Globex Ltd. Pattern suggests potential invoice manipulation.",
    confidence: 94,
    severity: "high" as const,
    timeframe: "Next 48h",
    icon: AlertTriangle,
  },
  {
    title: "Payroll Optimization Opportunity",
    description: "Machine learning models identified $42K in duplicate overtime calculations across Engineering dept.",
    confidence: 87,
    severity: "medium" as const,
    timeframe: "This Quarter",
    icon: Lightbulb,
  },
  {
    title: "Compliance Risk Reduction",
    description: "Automated policy enforcement reduced SOX violations by 34% compared to last quarter's performance.",
    confidence: 96,
    severity: "low" as const,
    timeframe: "Ongoing",
    icon: ShieldCheck,
  },
];

const topMetrics = [
  { label: "AI Accuracy", value: "97.3%", change: "+2.1%", trending: "up", icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10" },
  { label: "Fraud Prevented", value: "$1.2M", change: "+18%", trending: "up", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Avg Response Time", value: "1.4s", change: "-0.3s", trending: "down", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "Pattern Recognition", value: "842", change: "+127", trending: "up", icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
];

const departmentRisk = [
  { name: "Engineering", risk: 22, budget: "$2.4M", anomalies: 3 },
  { name: "Sales", risk: 45, budget: "$1.8M", anomalies: 8 },
  { name: "Marketing", risk: 38, budget: "$980K", anomalies: 5 },
  { name: "HR", risk: 12, budget: "$1.2M", anomalies: 1 },
  { name: "Operations", risk: 67, budget: "$3.1M", anomalies: 14 },
  { name: "Finance", risk: 8, budget: "$890K", anomalies: 0 },
];

export function InsightsPage() {
  const maxRisk = Math.max(...riskTrends.map((r) => r.score));

  return (
    <PageLayout title="AI Insights" subtitle="Machine learning-powered financial intelligence and predictive analytics.">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {topMetrics.map((m, i) => (
          <div key={i} className="glass-card rounded-xl p-5 border border-border/50 group hover:glow-primary transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl", m.bg, m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                  m.trending === "up" ? "text-emerald-400 bg-emerald-500/10" : "text-blue-400 bg-blue-500/10"
                )}
              >
                {m.trending === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.change}
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{m.label}</div>
          </div>
        ))}
      </div>

      {/* AI Predictions Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {aiPredictions.map((pred, i) => (
          <div
            key={i}
            className={cn(
              "relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] group",
              pred.severity === "high"
                ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent"
                : pred.severity === "medium"
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent"
                  : "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent"
            )}
          >
            {/* Subtle glow orb */}
            <div
              className={cn(
                "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity",
                pred.severity === "high" ? "bg-red-500" : pred.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
              )}
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "p-3 rounded-xl",
                    pred.severity === "high"
                      ? "bg-red-500/15 text-red-400"
                      : pred.severity === "medium"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-emerald-500/15 text-emerald-400"
                  )}
                >
                  <pred.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">{pred.timeframe}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{pred.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{pred.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Confidence: <span className="font-bold text-foreground">{pred.confidence}%</span>
                </div>
                <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pred.severity === "high"
                        ? "bg-red-500"
                        : pred.severity === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Trend + Department Risk */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Risk Score Trend - Sparkline Style */}
        <div className="xl:col-span-3 glass-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Risk Score Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-1">12-month organizational risk trajectory</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <TrendingDown className="h-4 w-4" /> -57% YoY
            </div>
          </div>
          <div className="flex items-end gap-2 h-48">
            {riskTrends.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {point.score}
                </div>
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-300 group-hover:opacity-100",
                    point.score > 60 ? "bg-gradient-to-t from-red-600 to-red-400" :
                    point.score > 40 ? "bg-gradient-to-t from-amber-600 to-amber-400" :
                    "bg-gradient-to-t from-emerald-600 to-emerald-400",
                    "opacity-80"
                  )}
                  style={{ height: `${(point.score / maxRisk) * 100}%` }}
                />
                <div className="text-[10px] text-muted-foreground font-medium">{point.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Risk Table */}
        <div className="xl:col-span-2 glass-card rounded-2xl p-6 border border-border/50">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary" /> Department Risk
          </h3>
          <div className="space-y-3">
            {departmentRisk
              .sort((a, b) => b.risk - a.risk)
              .map((dept, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors group">
                  <div className="w-8 text-center font-mono text-xs text-muted-foreground">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{dept.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{dept.budget}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          dept.risk > 50 ? "bg-red-500" : dept.risk > 30 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${dept.risk}%` }}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-md min-w-[36px] text-center",
                      dept.risk > 50 ? "bg-red-500/10 text-red-400" : dept.risk > 30 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                    )}
                  >
                    {dept.risk}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* AI Model Performance */}
      <div className="glass-card rounded-2xl p-6 border border-border/50">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
          <Brain className="h-5 w-5 text-violet-400" /> AI Model Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { model: "Anomaly Detector v3", accuracy: 97.3, f1: 0.94, latency: "1.2s", status: "active" },
            { model: "Pattern Classifier", accuracy: 94.1, f1: 0.91, latency: "0.8s", status: "active" },
            { model: "Risk Predictor β", accuracy: 89.7, f1: 0.86, latency: "2.1s", status: "training" },
          ].map((model, i) => (
            <div key={i} className="p-5 rounded-xl border border-border/40 bg-secondary/10 hover:bg-secondary/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">{model.model}</h4>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full",
                    model.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", model.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-blue-400 animate-pulse")} />
                  {model.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold">{model.accuracy}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Accuracy</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{model.f1}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">F1 Score</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{model.latency}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Latency</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
