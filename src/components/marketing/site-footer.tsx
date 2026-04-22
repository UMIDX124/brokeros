import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            BrokerOS
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
            The AI operating system for modern loan brokers. Built in the US for brokers who close, not chase.
          </p>
        </div>
        <FooterCol title="Product" links={[
          { label: "Features", href: "/#features" },
          { label: "How it works", href: "/#how" },
          { label: "Pricing", href: "/#pricing" },
          { label: "Changelog", href: "#" },
        ]} />
        <FooterCol title="Company" links={[
          { label: "About", href: "#" },
          { label: "Contact", href: "mailto:hello@brokeros.app" },
          { label: "Privacy", href: "#" },
          { label: "Terms", href: "#" },
        ]} />
        <FooterCol title="For brokers" links={[
          { label: "Sign in", href: "/login" },
          { label: "Register", href: "/register" },
          { label: "Start application", href: "/apply" },
          { label: "Support", href: "mailto:support@brokeros.app" },
        ]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} BrokerOS. All rights reserved.</div>
          <div className="font-stat">Built in the US 🇺🇸 for loan brokers who close.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4">{title}</h4>
      <ul className="space-y-3 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-foreground transition">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
