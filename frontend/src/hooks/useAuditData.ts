import { useEffect, useState } from "react";
import { getAuditEvents, getAuditStats, type AuditEvent, type AuditStats } from "@/lib/audit-api";

const defaultStats: AuditStats = {
  total_events: 0,
  total_transactions_reviewed: 0,
  total_flagged: 0,
  high_risk_count: 0,
  medium_risk_count: 0,
  low_risk_count: 0,
  total_volume: 0,
};

export function useAuditData() {
  const [stats, setStats] = useState<AuditStats>(defaultStats);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [nextStats, nextEvents] = await Promise.all([getAuditStats(), getAuditEvents()]);
        if (!mounted) return;
        setStats(nextStats);
        setEvents(nextEvents || []);
      } catch (err) {
        console.error("useAuditData fetch failed:", err);
        if (!mounted) return;
        setStats(defaultStats);
        setEvents([]);
      }
    }

    load();
    const interval = setInterval(load, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  return { stats: stats || defaultStats, events: events || [], refresh };
}
