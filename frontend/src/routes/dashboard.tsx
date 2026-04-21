import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/audit/Dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AuditAI" },
      {
        name: "description",
        content:
          "Enterprise-grade AI auditing dashboard for real-time financial anomaly detection, risk scoring, and reporting.",
      },
      { property: "og:title", content: "AuditAI Dashboard" },
      {
        property: "og:description",
        content:
          "Real-time AI-powered fraud detection and audit reporting for finance teams.",
      },
    ],
  }),
  component: Dashboard,
});
