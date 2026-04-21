import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DetectionResultPage } from "@/components/audit/DetectionResultPage";

export const Route = createFileRoute("/detection-result")({
  validateSearch: z.object({
    eventId: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Detection Result — AuditAI" },
      {
        name: "description",
        content: "Detailed detection JSON response with false-positive assessment and reviewer feedback.",
      },
      { property: "og:title", content: "AuditAI Detection Result" },
    ],
  }),
  component: DetectionResultPage,
});
