import { PageLayout } from "./PageLayout";
import { 
  ArrowDownRight, ArrowUpRight, Search, Filter, Download, 
  CheckCircle2, AlertTriangle, ShieldAlert, RotateCcw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuditData } from "@/hooks/useAuditData";
import { updateAuditVerdict } from "@/lib/audit-api";
import { toast } from "sonner";

export function TransactionsPage() {
  const { events, refresh } = useAuditData();
  const detectionEvents = (events || [])
    .filter((entry) => entry?.audit_event?.detection || entry?.audit_event?.extraction)
    .map((entry) => {
      const ae = entry.audit_event;
      const det = ae.detection || {} as any;
      const tx = ae.transaction || ae.extraction || {} as any;
      
      return {
        id: det.transaction_id || ae.id,
        eventId: ae.id,
        date: new Date(ae.created_at).toLocaleDateString(),
        vendor: tx.vendor || "Audit History",
        category: tx.category || "General",
        amount: Number(tx.amount || 0),
        isAnomaly: !!det.is_anomaly,
        verdict: det.verdict || "NEEDS_REVIEW",
        risk: det.risk_level || "LOW",
      };
    });

  return (
    <PageLayout 
      title="Transactions" 
      subtitle="View and analyze all organization transactions."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/40 backdrop-blur-md p-4 rounded-xl border border-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search transactions, IDs, or amounts..." 
              className="w-full bg-background border border-border pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-all text-sm font-medium">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium shadow-lg shadow-primary/20">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/20 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4 hidden md:table-cell">Date</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Risk/Category</th>
                  <th className="px-6 py-4">Verdict Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {detectionEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground bg-secondary/5">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-secondary/50">
                          <Search className="h-10 w-10 opacity-20" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground/70">No transactions found</p>
                          <p className="text-sm mt-1 max-w-[280px] mx-auto">Upload a document in the Reports tab to start auditing your organization's financials.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  detectionEvents.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30 transition-colors group">
                      {/* ... existing row content ... */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">{tx.vendor}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{tx.id}</div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                        {tx.date}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                          tx.risk === 'HIGH' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          tx.risk === 'MEDIUM' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-green-500/10 text-green-500 border-green-500/20"
                        )}>
                           {tx.risk} • {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                          tx.verdict === 'LIKELY_SAFE' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                          tx.verdict === 'LIKELY_FRAUD' ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" : 
                          tx.verdict === 'FALSE_POSITIVE' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {tx.verdict.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={cn(
                          "font-semibold font-mono flex items-center justify-end gap-1",
                          tx.verdict === 'LIKELY_SAFE' ? "text-green-500" : "text-foreground"
                        )}>
                          {tx.verdict === 'LIKELY_SAFE' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4 text-muted-foreground" />}
                          ₹{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={async () => {
                               try {
                                 await updateAuditVerdict(tx.eventId, "LIKELY_SAFE");
                                 toast.success(`Marked ${tx.vendor} as SAFE`);
                                 refresh?.();
                               } catch (e) {
                                 toast.error("Failed to update verdict");
                               }
                            }}
                            title="Mark as Safe"
                            className="p-2 rounded-lg hover:bg-green-500/20 text-muted-foreground hover:text-green-500 transition-all border border-transparent hover:border-green-500/30"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await updateAuditVerdict(tx.eventId, "FALSE_POSITIVE");
                                toast.warning(`Marked ${tx.vendor} as FALSE POSITIVE`);
                                refresh?.();
                              } catch (e) {
                                toast.error("Failed to update verdict");
                              }
                            }}
                            title="Mark as False Positive"
                            className="p-2 rounded-lg hover:bg-amber-500/20 text-muted-foreground hover:text-amber-500 transition-all border border-transparent hover:border-amber-500/30"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await updateAuditVerdict(tx.eventId, "LIKELY_FRAUD");
                                toast.error(`Marked ${tx.vendor} as FRAUD`);
                                refresh?.();
                              } catch (e) {
                                toast.error("Failed to update verdict");
                              }
                            }}
                            title="Confirm Fraud"
                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
