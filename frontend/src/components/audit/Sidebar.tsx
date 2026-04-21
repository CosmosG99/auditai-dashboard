import { Link, useMatchRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  AlertTriangle,
  FileText,
  Sparkles,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useThemeLang } from "./ThemeLangContext";
import { cn } from "@/lib/utils";

type ItemKey = "dashboard" | "transactions" | "anomalies" | "reports" | "insights" | "settings";
type Item = { key: ItemKey; icon: typeof LayoutDashboard };
const items: Item[] = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "transactions", icon: ArrowLeftRight },
  { key: "anomalies", icon: AlertTriangle },
  { key: "reports", icon: FileText },
  { key: "insights", icon: Sparkles },
  { key: "settings", icon: Settings },
];

export function Sidebar() {
  const { t } = useThemeLang();
  const matchRoute = useMatchRoute();

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="font-semibold tracking-tight text-sidebar-foreground">
          Audit<span className="text-primary">AI</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const isActive = matchRoute({ to: `/${it.key}` });
          return (
            <Link
              key={it.key}
              to={`/${it.key}`}
              className={cn(
                "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all outline-none",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-secondary/60 border border-transparent",
              )}
            >
              <it.icon className="h-4 w-4" />
              <span className="capitalize">{t[it.key as keyof typeof t]}</span>
              {isActive && (
                <motion.span
                  layoutId="active-dot"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 p-4 rounded-xl glass-card">
        <div className="text-xs text-muted-foreground mb-1">Compliance</div>
        <div className="text-2xl font-semibold">98.2%</div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[98%] bg-gradient-to-r from-primary to-accent" />
        </div>
      </div>
    </aside>
  );
}
