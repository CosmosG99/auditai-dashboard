import { createFileRoute } from "@tanstack/react-router";
import { AnomaliesPage } from "@/components/audit/AnomaliesPage";

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [
      { title: "Anomalies — AuditAI" },
      { name: "description", content: "AI-detected financial irregularities requiring immediate attention." },
      { property: "og:title", content: "AuditAI Anomalies" },
    ],
  }),
  component: AnomaliesPage,
});
