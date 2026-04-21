import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/audit/SettingsPage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AuditAI" },
      { name: "description", content: "Manage your account, security, and application preferences." },
      { property: "og:title", content: "AuditAI Settings" },
    ],
  }),
  component: SettingsPage,
});
