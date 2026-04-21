import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/audit/ReportsPage";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — AuditAI" },
      { name: "description", content: "Generated audit documentation, spreadsheets, and visual evidence." },
      { property: "og:title", content: "AuditAI Reports" },
    ],
  }),
  component: ReportsPage,
});
