import { Link, useMatchRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  AlertTriangle,
  FileText,
  Sparkles,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useThemeLang } from "./ThemeLangContext";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { AuditAILogo } from "./AuditAILogo";

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
  const { user, logout } = useAuth();
  const matchRoute = useMatchRoute();

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <AuditAILogo />
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

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl p-3 bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-foreground truncate">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            SIGN OUT
          </button>
        </div>
      </div>

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
