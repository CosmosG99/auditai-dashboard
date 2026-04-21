import { useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import { PageLayout } from "./PageLayout";
import { useAuditData } from "@/hooks/useAuditData";

export function DetectionResultPage() {
  const search = useSearch({ from: "/detection-result" });
  const { events } = useAuditData();

  const event = useMemo(
    () => (events || []).find((entry) => entry?.audit_event?.id === search.eventId),
    [events, search.eventId],
  );

  if (!event?.audit_event?.detection) {
    return (
      <PageLayout title="Detection Result" subtitle="No detection response found for the selected event.">
        <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground">
          Run CSV detection from the Reports page first, then open the result here.
        </div>
      </PageLayout>
    );
  }

  const detection = event.audit_event.detection;
  const falsePositive = event.audit_event.false_positive_assessment;
  const feedback = event.audit_event.feedback;

  return (
    <PageLayout title="Detection Result" subtitle={`Event ${event.audit_event.id} · ${event.audit_event.source_file ?? "uploaded file"}`}>
      <div className="glass-card rounded-2xl p-5">
        <div className="text-xs text-muted-foreground mb-2">Raw detection JSON response</div>
        <pre className="rounded-xl bg-secondary/40 border border-border p-4 text-xs overflow-auto">
          {JSON.stringify({ detection, false_positive_assessment: falsePositive, feedback }, null, 2)}
        </pre>
      </div>
    </PageLayout>
  );
}
