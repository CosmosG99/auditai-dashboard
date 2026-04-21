import { useState } from "react";
import { StatCards } from "./StatCards";
import { VolumeChart, CategoryChart, Heatmap } from "./Charts";
import { AnomalyFeed } from "./AnomalyFeed";
import { AnomalyDetail } from "./AnomalyDetail";
import { AIInsights, ReportPreview } from "./InsightsAndReport";
import { TimelineScrubber } from "./TimelineScrubber";
import { anomalies } from "@/lib/mock-data";
import { PageLayout } from "./PageLayout";

export function Dashboard() {
  const [selected, setSelected] = useState(anomalies[0]);

  return (
    <PageLayout 
      title="Financial Anomaly Overview"
      subtitle="Real-time monitoring across 12,438 transactions · Last sync just now"
    >
      <StatCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <VolumeChart />
        </div>
        <CategoryChart />
      </div>

      <Heatmap />

      <TimelineScrubber />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 min-h-[560px]">
          <AnomalyFeed selectedId={selected.id} onSelect={setSelected} />
        </div>
        <div className="xl:col-span-2 space-y-4">
          <AnomalyDetail anomaly={selected} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AIInsights />
            <ReportPreview />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
