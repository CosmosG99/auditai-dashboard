import { ShieldCheck } from "lucide-react";

export function AuditAILogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-sidebar-foreground">
            Audit<span className="text-primary">AI</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Financial audit intelligence</div>
        </div>
      )}
    </div>
  );
}