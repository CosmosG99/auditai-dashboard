import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categorySpend, heatmap, volumeSeries } from "@/lib/mock-data";
import { useThemeLang } from "./ThemeLangContext";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

export function VolumeChart({ data }: { data?: any[] }) {
  const { t } = useThemeLang();
  const displayData = data && data.length > 0 ? data : volumeSeries;
  return (
    <div className="glass-card rounded-2xl p-5 h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold">{t.txVolume}</h3>
          <p className="text-xs text-muted-foreground">Live stream • updated 2s ago</p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeOpacity: 0.4 }} />
          <Area type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={2} fill="url(#volGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }: { data?: any[] }) {
  const { t } = useThemeLang();
  const displayData = data && data.length > 0 ? data : categorySpend;
  return (
    <div className="glass-card rounded-2xl p-5 h-[320px] flex flex-col">
      <h3 className="text-sm font-semibold mb-2">{t.spendCat}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={displayData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)", opacity: 0.5 }} />
          <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Heatmap({ events = [] }: { events?: any[] }) {
  const { t } = useThemeLang();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Real-time bucket logic
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const realBuckets = (events || []).reduce((acc: any, event) => {
    const date = new Date(event.audit_event.created_at);
    const day = dayNames[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const useMock = events.length === 0;
  const max = useMock 
    ? Math.max(...heatmap.map((c) => c.value))
    : Math.max(...Object.values(realBuckets) as number[], 1);

  return (
    <div className="glass-card rounded-2xl p-5 h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">{t.anomFreq}</h3>
          <p className="text-xs text-muted-foreground">{useMock ? "Historical data" : "Real-time activity"}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          low
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
              <div key={o} className="h-2 w-3 rounded-sm" style={{ background: `color-mix(in oklab, var(--primary) ${o * 100}%, transparent)` }} />
            ))}
          </div>
          high
        </div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-1">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-[9px] text-muted-foreground text-center">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
            {days.map((d) => (
              <div key={d} className="contents">
                <div className="text-[10px] text-muted-foreground self-center">{d}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const val = useMock 
                    ? heatmap.find((c) => c.day === d && c.hour === h)?.value || 0
                    : realBuckets[`${d}-${h}`] || 0;
                  const intensity = val / max;
                  return (
                    <div
                      key={`${d}-${h}`}
                      title={`${d} ${h}:00 — ${val} events`}
                      className="aspect-square rounded-[3px] transition-transform hover:scale-125"
                      style={{
                        background: `color-mix(in oklab, var(--primary) ${Math.max(8, intensity * 100)}%, var(--secondary))`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
