import { Zap } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <ComingSoon
      eyebrow="Automations"
      title="Automations land in Phase 4."
      body="High-score leads get an instant, personalized outreach + document request email. Configurable thresholds and templates."
      icon={Zap}
    />
  );
}
