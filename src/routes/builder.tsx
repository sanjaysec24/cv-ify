import { createFileRoute } from "@tanstack/react-router";
import { Builder } from "@/components/builder";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Resume Builder — Resume.AI" },
      { name: "description", content: "Step-by-step AI resume builder with live preview, ATS scoring, and PDF download." },
    ],
  }),
  component: Builder,
});
