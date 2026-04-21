import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  uploadForAudit, 
  uploadCsvBulk, 
  updateAuditVerdict,
  type AuditEvent, 
  type BulkResult 
} from "@/lib/audit-api";
import { downloadAuditPDF } from "@/lib/pdf-utils";
import { 
  FileText, FileSpreadsheet, FileImage, Calendar, Clock, 
  CreditCard, Tag, ShieldAlert, ShieldCheck, AlertTriangle, 
  CheckCircle2, Upload, Loader2, Table as TableIcon, Eye, Download 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageLayout } from "./PageLayout";
import { useAuditData } from "@/hooks/useAuditData";

/* ───────── fallback report cards ───────── */
const fallbackReports: any[] = [];

/* ═══════════════════════════════════════════
   Extraction Card  (always shown for PDFs/Images)
   ═══════════════════════════════════════════ */
function ExtractionCard({ ext }: { ext: any }) {
  if (!ext) return null;
  return (
    <div className="rounded-2xl border border-border/40 bg-card/10 backdrop-blur overflow-hidden">
      <div className="p-6">
        {/* Vendor + Amount */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              🏪 {ext.vendor || "Unknown Vendor"}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {ext.date || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {ext.time || "—"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-primary tracking-tight">
              ₹{Number(ext.amount || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Pill badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm font-medium">
            <CreditCard className="w-4 h-4" /> {ext.payment_method || "Unknown"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm font-medium">
            <Tag className="w-4 h-4" /> {ext.category || "Uncategorized"}
          </span>
          {ext.invoice_number && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm font-medium">
              # {ext.invoice_number}
            </span>
          )}
        </div>

        {/* Line items table */}
        {ext.line_items && Array.isArray(ext.line_items) && ext.line_items.length > 0 && (
          <div className="mb-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Line Items
            </div>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-secondary/20">
              <table className="w-full text-sm">
                <tbody>
                  {ext.line_items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                      <td className="py-2 px-3">{item.description || item.name || "Item"}</td>
                      <td className="py-2 px-3 text-right font-medium">
                        ₹{Number(item.amount || item.price || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confidence bar */}
        <div className="space-y-1.5 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Extraction Confidence</span>
            <span>{Math.round((ext.confidence || 0) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.round((ext.confidence || 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Detection Card
   ═══════════════════════════════════════════ */
function DetectionCard({
  det,
  fpAssessment,
  transaction,
  showTransactionHeader = false,
  eventId,
  onVerdictUpdated
}: {
  det: any;
  fpAssessment?: any;
  transaction?: any;
  showTransactionHeader?: boolean;
  eventId?: string;
  onVerdictUpdated?: (newVerdict: string) => void;
}) {
  if (!det) return null;

  const riskLevel: string = det.risk_level || "MEDIUM";
  const anomalyScore = Math.round(det.anomaly_score ?? 0);
  const signals: string[] = Array.isArray(det.suspicious_signals)
    ? det.suspicious_signals
    : [];
  const reason: string = det.reason || "No specific reason provided.";
  const fpProb = Number(
    det.false_positive_probability ?? fpAssessment?.false_positive_probability ?? 0.5
  );
  const verdict: string =
    det.verdict || fpAssessment?.verdict || "NEEDS_REVIEW";
  const displayVerdict = verdict.replace(/_/g, " ");

  /* colour helpers */
  const riskColors =
    riskLevel === "HIGH"
      ? { banner: "bg-red-500/20 text-red-400", glow: "animate-red-pulse border-red-500/20", tag: "bg-red-500/10 text-red-500" }
      : riskLevel === "MEDIUM"
        ? { banner: "bg-amber-500/20 text-amber-400", glow: "animate-amber-glow border-amber-500/20", tag: "bg-amber-500/10 text-amber-500" }
        : { banner: "bg-green-500/20 text-green-400", glow: "animate-green-glow border-green-500/20", tag: "bg-green-500/10 text-green-500" };

  const ringColor =
    riskLevel === "HIGH"
      ? "text-red-500"
      : riskLevel === "MEDIUM"
        ? "text-amber-500"
        : "text-green-500";

  const verdictStyle =
    verdict === "LIKELY_SAFE"
      ? "text-green-500 border-green-500 bg-green-500/10"
      : verdict === "LIKELY_FRAUD"
        ? "text-red-500 border-red-500 bg-red-500/10 animate-shake"
        : verdict === "FALSE_POSITIVE"
          ? "text-amber-500 border-amber-500 bg-amber-500/10"
          : "text-blue-500 border-blue-500 bg-blue-500/10";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/10 backdrop-blur overflow-hidden flex flex-col h-full",
        riskColors.glow
      )}
    >
      {/* ── Risk level banner ── */}
      <div className={cn("p-4 flex items-center justify-between font-bold text-lg border-b border-border/20", riskColors.banner)}>
        <div className="flex items-center gap-3">
          {riskLevel === "HIGH" ? (
            <ShieldAlert className="w-6 h-6" />
          ) : (
            <ShieldCheck className="w-6 h-6" />
          )}
          {riskLevel === "LOW" && "🟢"} {riskLevel === "MEDIUM" && "🟡"}{" "}
          {riskLevel === "HIGH" && "🔴"} RISK LEVEL: {riskLevel}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {showTransactionHeader && transaction && (
          <div className="mb-6 p-4 rounded-xl border border-border/50 bg-secondary/10 flex flex-wrap justify-between items-center gap-4">
             <div>
               <div className="text-xl font-bold flex items-center gap-2">
                 {transaction.vendor}
               </div>
               <div className="text-xs text-muted-foreground mt-1 tracking-wider font-mono">
                 {transaction.id} • {transaction.timestamp?.substring(0, 10)}
               </div>
             </div>
             <div className="text-2xl font-black text-primary">₹{Number(transaction.amount || 0).toLocaleString()}</div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 mb-6 flex-1">
          {/* LEFT — reason + signals */}
          <div className="flex-1 space-y-5">
            {/* Reason quote box */}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                Evaluation Reason
              </div>
              <div className={cn("rounded-xl p-4 border-l-4 text-sm leading-relaxed font-medium bg-black/20", 
                 riskLevel === "HIGH" ? "border-red-500 text-red-50" : 
                 riskLevel === "MEDIUM" ? "border-amber-500 text-amber-50" : 
                 "border-green-500 text-green-50"
              )}>
                {reason}
              </div>
            </div>

            {/* Suspicious signals */}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                Suspicious Signals
              </div>
              {signals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {signals.map((signal, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"
                    >
                      <AlertTriangle className="w-3 h-3" /> {signal}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                  <CheckCircle2 className="w-3 h-3" /> No signals detected
                </span>
              )}
            </div>

            {/* False positive probability bar */}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold flex justify-between">
                <span>False Positive Likelihood</span>
                <span>{Math.round(fpProb * 100)}%</span>
              </div>
              <div className="h-1.5 mt-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round(fpProb * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT — anomaly gauge + verdict stamp */}
          <div className="md:w-56 flex flex-col items-center justify-center bg-secondary/20 rounded-xl p-6 border border-border/50 shrink-0">
            {/* Anomaly gauge */}
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold text-center">
              Anomaly Score
            </div>
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={cn("transition-all duration-1000 ease-out", ringColor)}
                  strokeDasharray={`${anomalyScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-black">{anomalyScore}</span>
              </div>
            </div>

            {/* Verdict stamp */}
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold text-center mt-auto">
              Verdict
            </div>
            <div
              className={cn(
                "py-3 px-3 text-center text-sm font-black uppercase tracking-wider border-2 rounded-xl w-full flex flex-col gap-1 items-center justify-center",
                verdictStyle
              )}
            >
              {verdict === "LIKELY_SAFE" && <CheckCircle2 className="w-5 h-5"/>}
              {verdict === "LIKELY_FRAUD" && <ShieldAlert className="w-5 h-5"/>}
              {verdict === "NEEDS_REVIEW" && <AlertTriangle className="w-5 h-5"/>}
              {verdict === "FALSE_POSITIVE" && <AlertTriangle className="w-5 h-5"/>}
              <span>{displayVerdict}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-auto border-t border-border/40">
          <button 
            onClick={async () => {
              if (!eventId) return;
              try {
                await updateAuditVerdict(eventId, "LIKELY_SAFE");
                toast.success("Transaction marked as SAFE");
                onVerdictUpdated?.("LIKELY_SAFE");
                refresh?.();
              } catch (e) {
                toast.error("Failed to update verdict");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 text-green-500 font-semibold hover:bg-green-500/20 transition-colors border border-green-500/20 text-sm">
            <CheckCircle2 className="w-4 h-4" /> MARK SAFE
          </button>
          
          <button 
            onClick={async () => {
              if (!eventId) return;
              try {
                await updateAuditVerdict(eventId, "FALSE_POSITIVE");
                toast.warning("Marked as False Positive");
                onVerdictUpdated?.("FALSE_POSITIVE");
                refresh?.();
              } catch (e) {
                toast.error("Failed to update verdict");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 text-amber-500 font-semibold hover:bg-amber-500/20 transition-colors border border-amber-500/20 text-sm">
            <AlertTriangle className="w-4 h-4" /> FALSE POSITIVE
          </button>

          <button 
            onClick={async () => {
              if (!eventId) return;
              try {
                await updateAuditVerdict(eventId, "LIKELY_FRAUD");
                toast.error("Transaction flagged as FRAUD");
                onVerdictUpdated?.("LIKELY_FRAUD");
                refresh?.();
              } catch (e) {
                toast.error("Failed to update verdict");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20 text-sm">
            <ShieldAlert className="w-4 h-4" /> CONFIRM FRAUD
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════ */
export function ReportsPage() {
  const { events, refresh } = useAuditData();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  
  const [latestResult, setLatestResult] = useState<BulkResult | null>(null);
  const [selectedBulkRowIdx, setSelectedBulkRowIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  const onFileChange = (f: File | null) => {
    setFile(f);
    if (f && (f.type.startsWith("image/") || f.type === "application/pdf")) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreviewUrl(null);
      setImageBase64(null);
    }
  };

  const onUpload = async () => {
    if (!file) return;
    setBusy(true);
    const toastId = toast.loading("Analysing transactions with Gemma AI...");
    try {
      let result: BulkResult;

      if (file.name.toLowerCase().endsWith(".csv")) {
        result = await uploadCsvBulk(file);
      } else {
        const rawResult = await uploadForAudit(file);
        // Normalize single/multi document extraction into BulkResult
        const resultItems = (Array.isArray(rawResult) ? rawResult : [rawResult]).filter(i => i != null);
        const flagged = resultItems.filter(r => r?.audit_event?.detection?.is_anomaly);
        
        result = {
          results: resultItems,
          summary: {
            total: resultItems.length,
            analyzed: resultItems.length,
            flagged: flagged.length,
            high_risk: flagged.filter(r => r?.audit_event?.detection?.risk_level === 'HIGH').length,
            medium_risk: flagged.filter(r => r?.audit_event?.detection?.risk_level === 'MEDIUM').length,
            low_risk: flagged.filter(r => r?.audit_event?.detection?.risk_level === 'LOW').length,
          }
        };
      }

      setLatestResult(result);
      setSelectedBulkRowIdx(0);
      toast.success(`Analysis complete: Found ${result.summary.flagged} anomalies.`, { id: toastId });
      refresh?.();
    } catch (e: any) {
      console.error(e);
      toast.error(`Upload failed: ${e.message}`, { id: toastId });
    } finally {
      setBusy(false);
    }
  };
  
  const getCsvDownloadUrl = (bulk: BulkResult) => {
      if (!bulk.results?.length) return "";
      
      const headers = ["ID", "Vendor", "Amount", "Risk Level", "Anomaly Score", "Verdict", "Reason", "Suspicious Signals"];
      const rows = (bulk.results || []).map(r => {
          if (!r?.audit_event) return "";
          const tx = r.audit_event.transaction as any;
          const det = r.audit_event.detection as any;
          return [
              tx?.id || r.audit_event.id,
              tx?.vendor || "Unknown",
              tx?.amount || 0,
              det?.risk_level || "UNKNOWN",
              det?.anomaly_score || 0,
              det?.verdict || "UNKNOWN",
              `"${(det?.reason || "").replace(/"/g, '""')}"`,
              `"${(det?.suspicious_signals?.join("; ") || "").replace(/"/g, '""')}"`
          ].join(",");
      }).filter(line => line !== "");
      
      const csv = [headers.join(","), ...rows].join("\n");
      return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  };

  const reports = (events || [])
    .filter((entry) => entry?.audit_event?.detection || entry?.audit_event?.extraction)
    .map((entry) => {
      const tx = entry?.audit_event?.transaction || entry?.audit_event?.extraction || {};
      const isAnomalous = entry?.audit_event?.detection?.is_anomaly;
      
      return {
        id: entry?.audit_event?.id,
        title: `${tx.vendor || "Audit"} Report`,
        date: new Date(entry?.audit_event?.created_at || Date.now()).toLocaleDateString(),
        size: tx.amount ? `₹${tx.amount.toLocaleString()}` : "N/A",
        type: ".pdf",
        icon: isAnomalous ? ShieldAlert : CheckCircle2,
        color: isAnomalous ? "text-red-400" : "text-green-400",
        bg: isAnomalous ? "bg-red-400/10" : "bg-green-400/10",
        riskLevel: entry?.audit_event?.detection?.risk_level || "LOW",
        score: Math.round(entry?.audit_event?.detection?.anomaly_score || 0),
        originalEvent: entry
      };
    });
  const displayReports = reports;

  return (
    <PageLayout
      title="Audit Reports"
      subtitle="Upload invoices to securely extract and analyze data, or upload thick CSV exports for bulk anomaly detection."
    >
      {/* ── Upload section ── */}
      {/* ── Aesthetic Upload section ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className={cn(
          "flex-1 relative group rounded-2xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center",
          file ? "border-primary/50 bg-primary/5" : "border-border/40 bg-card/10 hover:border-primary/30 hover:bg-card/20"
        )}>
          <input
            type="file"
            accept=".csv,.pdf,image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="mb-4 p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
          </div>

          {file ? (
            <div className="space-y-1">
              <h3 className="font-bold text-lg">{file.name}</h3>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB • Ready for AI Audit</p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Drop financial files here</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Support for receipts (images), bank statements (PDF), and bulk exports (CSV)
              </p>
            </div>
          )}
          
          <button
            onClick={(e) => { e.stopPropagation(); onUpload(); }}
            disabled={!file || busy}
            className="mt-6 z-20 relative inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
            {busy ? "OLLAMA IS SCANNING..." : "RUN FRAUD DETECTION"}
          </button>
        </div>

        {/* Real-time Preview */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:w-72 h-48 lg:h-auto rounded-2xl border border-border/40 bg-card/10 overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-3 left-3 z-20">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/70">Document Preview</p>
                <p className="text-xs font-bold text-white truncate max-w-[200px]">{file?.name}</p>
              </div>
              <img 
                src={previewUrl} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt="Upload preview"
              />
              {busy && (
                <div className="absolute inset-0 z-30 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filtered Results rendering ── */}
      {latestResult?.results && (() => {
        const filteredResults = (latestResult.results || []).filter(r => {
           if (!r?.audit_event) return false;
           const tx = (r.audit_event.transaction || r.audit_event.extraction) as any;
           const det = r.audit_event.detection as any;
           const matchesSearch = !searchQuery || 
             tx?.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             det?.reason?.toLowerCase().includes(searchQuery.toLowerCase());
           const matchesRisk = !riskFilter || det?.risk_level === riskFilter;
           return matchesSearch && matchesRisk;
        });

        return (
          <div className="mb-10 space-y-4">
             {/* Bulk Summary Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="p-4 rounded-xl border border-border bg-card/30 flex flex-col gap-1">
                 <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Evaluated</span>
                 <span className="text-2xl font-black">{latestResult.summary.analyzed}</span>
               </div>
               <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 flex flex-col gap-1">
                 <span className="text-xs uppercase font-bold tracking-wider">High Risk</span>
                 <span className="text-2xl font-black">{latestResult.summary.high_risk}</span>
               </div>
               <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 flex flex-col gap-1">
                 <span className="text-xs uppercase font-bold tracking-wider">Medium Risk</span>
                 <span className="text-2xl font-black">{latestResult.summary.medium_risk}</span>
               </div>
               <div className="p-4 flex items-center justify-center">
                 <a 
                   href={getCsvDownloadUrl(latestResult)}
                   download={`AuditAI_Fraud_Report_${new Date().getTime()}.csv`}
                   className="w-full h-full flex items-center justify-center gap-2 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground font-semibold transition-all">
                   <Download className="w-5 h-5"/> Export PDF Report
                 </a>
               </div>
             </div>

             {/* Search & Risk Filters */}
             <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search by vendor or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex bg-secondary/50 p-1 rounded-lg border border-border shrink-0">
                  {['HIGH', 'MEDIUM', 'LOW'].map(level => (
                    <button
                      key={level}
                      onClick={() => setRiskFilter(riskFilter === level ? null : level)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-bold transition-all",
                        riskFilter === level 
                          ? level === 'HIGH' ? "bg-red-500 text-white" : level === 'MEDIUM' ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
             </div>

             {/* Split View */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] items-stretch">
               
               {/* Left: Table */}
               <div className="lg:col-span-7 flex flex-col rounded-xl border border-border bg-card/20 overflow-hidden">
                 <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                   <div className="flex items-center gap-2 font-semibold">
                     <TableIcon className="w-5 h-5 text-primary" />
                     Transactions ({filteredResults.length})
                   </div>
                 </div>
                 <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
                   {filteredResults.length === 0 ? (
                     <div className="p-20 text-center text-muted-foreground">No transactions matching filters.</div>
                   ) : (
                     <table className="w-full text-sm text-left whitespace-nowrap">
                       <thead className="bg-secondary/50 text-muted-foreground font-medium sticky top-0 backdrop-blur z-10">
                         <tr>
                           <th className="px-4 py-3">Vendor</th>
                           <th className="px-4 py-3 text-right">Amount</th>
                           <th className="px-4 py-3">Risk Level</th>
                           <th className="px-4 py-3 text-center">Score</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border/50">
                         {filteredResults.map((r, idx) => {
                           if (!r?.audit_event) return null;
                           const tx = (r.audit_event.transaction || r.audit_event.extraction) as any;
                           const det = r.audit_event.detection as any;
                           const originalIdx = latestResult.results.indexOf(r);
                           const isSelected = originalIdx === selectedBulkRowIdx;
                           
                           return (
                             <tr 
                               key={r.audit_event.id} 
                               onClick={() => setSelectedBulkRowIdx(originalIdx)}
                               className={cn(
                                 "cursor-pointer transition-colors border-l-4",
                                 isSelected ? "bg-primary/10 border-l-primary" : "hover:bg-secondary/30 border-l-transparent",
                                 !isSelected && det?.risk_level === 'HIGH' ? "bg-red-500/5 hover:bg-red-500/10 border-l-red-500/50" : "",
                                 !isSelected && det?.risk_level === 'MEDIUM' ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-amber-500/50" : ""
                               )}
                             >
                               <td className="px-4 py-3">
                                 <div className={cn("font-medium", isSelected ? "text-primary" : "")}>{tx?.vendor || "Unknown"}</div>
                                 <div className="text-[10px] text-muted-foreground font-mono">{r?.audit_event?.id}</div>
                               </td>
                               <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                 ₹{Number(tx?.amount || 0).toLocaleString()}
                               </td>
                               <td className="px-4 py-3">
                                 <div className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black", 
                                    det?.risk_level === 'HIGH' ? "bg-red-500/20 text-red-500" :
                                    det?.risk_level === 'MEDIUM' ? "bg-amber-500/20 text-amber-500" :
                                    "bg-green-500/20 text-green-500"
                                 )}>
                                   {det?.risk_level || "LOW"}
                                 </div>
                               </td>
                               <td className="px-4 py-3 text-center font-black">
                                 {Math.round(det?.anomaly_score || 0)}
                                </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   )}
                 </div>
               </div>

               {/* Right: Detailed Fraud Report */}
               <div className="lg:col-span-5 h-full">
                 {latestResult.results[selectedBulkRowIdx] ? (() => {
                    const r = latestResult.results[selectedBulkRowIdx];
                    if (!r?.audit_event) return null;
                    const det = r.audit_event.detection;
                    const ext = r.audit_event.extraction;
                    const tx = r.audit_event.transaction;
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-end gap-3 mb-2">
                           <button 
                             onClick={() => downloadAuditPDF(r, imageBase64)}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                             <Download className="w-3 h-3" /> Download PDF Report
                           </button>
                        </div>
                        <DetectionCard 
                          det={det} 
                          fpAssessment={r.audit_event.false_positive_assessment} 
                          transaction={tx || ext}
                          showTransactionHeader={true}
                          eventId={r.audit_event.id}
                          onVerdictUpdated={() => refresh?.()}
                        />
                        {ext && <ExtractionCard ext={ext} />}
                      </div>
                    );
                 })() : (
                    <div className="h-full rounded-xl border border-border bg-card/20 flex items-center justify-center text-muted-foreground py-20 text-center">
                      Select a row to view fraud report
                    </div>
                 )}
               </div>
             </div>
          </div>
        );
      })()}

      {/* ── Report grid (past reports) ── */}
      <h3 className="text-xl font-bold mb-4 mt-8">Past Audit Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(displayReports || []).map((report) => (
          <div
            key={report.id}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/10 backdrop-blur glass-card transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/30 flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className={cn("p-3 rounded-xl", report.bg, report.color)}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className={cn(
                      "text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider w-fit",
                      report.riskLevel === 'HIGH' ? "bg-red-500/20 text-red-500" :
                      report.riskLevel === 'MEDIUM' ? "bg-amber-500/20 text-amber-500" :
                      "bg-green-500/20 text-green-500"
                    )}>
                      {report.riskLevel} RISK
                    </div>
                    <div className="text-xl font-black mt-0.5">Score: {report.score}</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground/60">{report.id}</div>
              </div>
              <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {report.title}
                {report.type}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {report.date}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {report.size}
                </div>
              </div>
            </div>
            <div className="border-t border-border/40 p-3 bg-secondary/20 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <button 
                onClick={() => downloadAuditPDF(report.originalEvent)}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20">
                <Download className="h-4 w-4" /> Download Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
