import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/components/audit/InsightsPage";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — AuditAI" },
      { name: "description", content: "Machine learning-powered financial intelligence and predictive analytics." },
      { property: "og:title", content: "AuditAI Insights" },
    ],
  }),
  component: InsightsPage,
});
