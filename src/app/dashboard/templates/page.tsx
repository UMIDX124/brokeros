import { Mail } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Email templates" };

export default function TemplatesPage() {
  return (
    <ComingSoon
      eyebrow="Templates"
      title="Email templates land in Phase 4."
      body="Welcome, doc request, follow-up, approval, and declined templates — editable with live preview and merge tags."
      icon={Mail}
    />
  );
}
