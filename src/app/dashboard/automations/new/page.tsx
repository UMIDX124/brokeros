import type { Metadata } from "next";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";

export const metadata: Metadata = { title: "New automation" };
export const dynamic = "force-dynamic";

export default function NewAutomationPage() {
  return <WorkflowBuilder />;
}
