import { Settings as SettingsIcon } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      eyebrow="Settings"
      title="Settings land in Phase 4."
      body="Scoring thresholds, pipeline stages, notification preferences, and team management."
      icon={SettingsIcon}
    />
  );
}
