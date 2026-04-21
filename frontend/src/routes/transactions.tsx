import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/audit/TransactionsPage";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — AuditAI" },
      { name: "description", content: "View and analyze all organization transactions with AI-powered insights." },
      { property: "og:title", content: "AuditAI Transactions" },
    ],
  }),
  component: TransactionsPage,
});
