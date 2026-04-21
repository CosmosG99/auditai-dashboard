import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatAssistant } from "./ChatAssistant";
import { ThemeLangProvider } from "./ThemeLangContext";

export function PageLayout({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <ThemeLangProvider>
      <div className="min-h-screen w-full flex bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 p-4 lg:p-6 space-y-6">
            {(title || subtitle) && (
              <div>
                {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}
            
            {children}

            <footer className="pt-4 pb-2 text-xs text-muted-foreground text-center">
              AuditAI · Enterprise Financial Anomaly Detection · v4.2.1
            </footer>
          </main>
        </div>
        <ChatAssistant />
      </div>
    </ThemeLangProvider>
  );
}
