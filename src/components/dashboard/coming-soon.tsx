import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  eyebrow,
  title,
  body,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-20 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground font-stat">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
