import { useState, useEffect } from "react";
import { StatCards } from "./StatCards";
import { VolumeChart, CategoryChart, Heatmap } from "./Charts";
import { AnomalyFeed } from "./AnomalyFeed";
import { AnomalyDetail } from "./AnomalyDetail";
import { AIInsights, ReportPreview } from "./InsightsAndReport";
import { TimelineScrubber } from "./TimelineScrubber";
import { anomalies as mockAnomalies, type Anomaly } from "@/lib/mock-data";
import { PageLayout } from "./PageLayout";
import { useAuditData } from "@/hooks/useAuditData";

export function Dashboard() {
  const { events, stats } = useAuditData();

  const realAnomalies: Anomaly[] = (events || [])
    .filter(e => e?.audit_event?.detection && e?.audit_event?.detection?.is_anomaly)
    .map(e => {
       const det = e?.audit_event?.detection || {} as any;
       const tx = e?.audit_event?.transaction || {} as any;
       const ext = e?.audit_event?.extraction || {} as any;
       const source = tx.amount ? tx : ext;
       
       return {
         id: det.transaction_id || e.audit_event.id,
         amount: Number(source.amount || 0),
         risk: det.risk_level === 'HIGH' ? 'High' : det.risk_level === 'MEDIUM' ? 'Medium' : 'Low',
         reason: det.reason || "Suspicious transaction detected",
         timestamp: source.timestamp ? (source.timestamp.includes('T') ? source.timestamp.substring(11, 16) : source.timestamp) : (source.time || new Date(e.audit_event.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
         vendor: source.vendor || "Unknown Vendor",
         category: source.category || "Uncategorized",
         confidence: Math.round((det.confidence || 0) * 100) || Math.round(det.anomaly_score) || 95,
         tags: Array.isArray(det.suspicious_signals) ? det.suspicious_signals : []
       };
    });
  const displayAnomalies = realAnomalies.length > 0 ? realAnomalies : mockAnomalies;
  const [selected, setSelected] = useState<Anomaly | null>(displayAnomalies[0] || null);

  useEffect(() => {
    // If real data finally comes in, switch context to first real anomaly
    if (realAnomalies.length > 0 && (!selected || selected.id.startsWith("MOCK"))) {
      setSelected(realAnomalies[0]);
    }
  }, [realAnomalies, selected]);

  const categoryData = (events || []).reduce((acc: any[], event) => {
    const ae = event?.audit_event as any;
    if (!ae) return acc;
    const cat = ae.transaction?.category || ae.extraction?.category || "Other";
    const amount = ae.transaction?.amount || ae.extraction?.amount || 0;
    const existing = acc.find(a => a.name === cat);
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: cat, value: amount });
    }
    return acc;
  }, []);

  const volumeData = (events || []).reduce((acc: any[], event) => {
    const ae = event?.audit_event;
    if (!ae) return acc;
    const date = new Date(ae.created_at);
    const hour = `${date.getHours()}:00`;
    const amount = (ae as any).transaction?.amount || (ae as any).extraction?.amount || 0;
    const existing = acc.find(a => a.hour === hour);
    if (existing) {
      existing.volume += amount;
    } else {
      acc.push({ hour, volume: amount });
    }
    return acc;
  }, []).sort((a,b) => parseInt(a.hour) - parseInt(b.hour));

  return (
    <PageLayout 
      title="Financial Anomaly Overview"
      subtitle={`Real-time monitoring across ${stats.total_transactions_reviewed.toLocaleString()} transactions`}
    >
      <StatCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <VolumeChart data={volumeData} />
        </div>
        <CategoryChart data={categoryData} />
      </div>

      <Heatmap events={events} />

      <TimelineScrubber events={events} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 min-h-[560px]">
          <AnomalyFeed 
            anomalies={displayAnomalies} 
            selectedId={selected?.id || ""} 
            onSelect={setSelected} 
          />
        </div>
        <div className="xl:col-span-2 space-y-4">
          {selected && <AnomalyDetail anomaly={selected} />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AIInsights />
            <ReportPreview />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
