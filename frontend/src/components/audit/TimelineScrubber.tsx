import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Clock } from "lucide-react";
import { volumeSeries } from "@/lib/mock-data";

export function TimelineScrubber({ events = [] }: { events?: any[] }) {
  const [hour, setHour] = useState(14);
  
  const realSeries = Array.from({ length: 24 }).map((_, h) => {
    const count = (events || []).filter(e => {
      const d = new Date(e.audit_event.created_at);
      return d.getHours() === h;
    }).length;
    return { hour: `${h}:00`, anomalies: count };
  });

  const useMock = events.length === 0;
  const displaySeries = useMock ? volumeSeries : realSeries;
  const max = Math.max(...displaySeries.map((v) => v.anomalies), 1);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {useMock ? "Historical Timeline" : "Active Audit Scrubber"} · Last 24h
          </h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {useMock ? "Viewing historical peaks" : `Analyzed ${events.length} transactions`}
        </div>
      </div>
      <div className="relative h-16 mb-2">
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {displaySeries.map((v, i) => {
            const h = (v.anomalies / max) * 100;
            const active = i === hour;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                title={`${v.hour}: ${v.anomalies} events`}
                style={{
                  height: `${Math.max(8, h)}%`,
                  background: active
                    ? "var(--primary)"
                    : `color-mix(in oklab, var(--primary) ${30 + h * 0.4}%, var(--secondary))`,
                  opacity: active ? 1 : 0.7,
                }}
              />
            );
          })}
        </div>
      </div>
      <Slider value={[hour]} onValueChange={(v) => setHour(v[0])} min={0} max={23} step={1} />
    </div>
  );
}
