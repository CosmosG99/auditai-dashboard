import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AuditAI — AI-Powered Financial Fraud Detection" },
      {
        name: "description",
        content:
          "Detect financial fraud before it happens. AuditAI monitors millions of transactions in real-time using AI-powered anomaly detection.",
      },
      {
        property: "og:title",
        content: "AuditAI — AI-Powered Financial Fraud Detection",
      },
      {
        property: "og:description",
        content:
          "Real-time AI-powered fraud detection, duplicate payment alerts, and policy violation reporting.",
      },
    ],
  }),
  component: LandingPage,
});
