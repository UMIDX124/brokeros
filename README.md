# BrokerOS

> The AI-powered operating system for modern loan brokers.

Capture leads, score them with AI, auto-follow-up, collect documents, and close more deals — all from one beautiful dashboard.

**Target users:** Small business loan brokers & lenders originating SBA loans, MCAs (merchant cash advances), equipment financing, and working capital lines.

---

## Tech stack

| Layer            | Choice                                                  |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack, Node runtime)        |
| Language         | TypeScript (strict + `noUncheckedIndexedAccess`)        |
| Styling          | Tailwind CSS v4 + shadcn/ui (`new-york`, Hearth theme)  |
| ORM / DB         | Prisma 6 + Neon PostgreSQL                              |
| Auth             | NextAuth v5 (credentials + Prisma adapter)              |
| AI               | Groq SDK — `llama-3.3-70b-versatile`                    |
| Email            | Resend                                                  |
| Forms            | React Hook Form + Zod                                   |
| Charts           | Recharts                                                |
| Package manager  | pnpm (never npm)                                        |
| Deployment       | Vercel                                                  |

### Theme — Hearth Mode

Brand colors are locked. No purple, no indigo, no fintech blue.

| Token       | Hex       | Purpose                    |
| ----------- | --------- | -------------------------- |
| primary     | `#1A1A2E` | Deep navy-black — trust    |
| accent      | `#F4A261` | Warm amber — primary CTA   |
| success     | `#06A77D` | Sage green — money-positive |
| destructive | `#C44536` | Warm red                   |
| background  | `#FAF8F5` | Warm off-white             |
| surface     | `#FFFFFF` | Cards                      |

Fonts: **Inter** for UI, **JetBrains Mono** for numbers / stats (via `.font-stat`).

---

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Configure env

```bash
cp .env.example .env.local
# fill in DATABASE_URL (Neon), NEXTAUTH_SECRET, GROQ_API_KEY, RESEND_API_KEY
```

### 3. Push the schema

```bash
pnpm db:push     # or: pnpm db:migrate to create a migration
pnpm db:seed     # seed demo data (30 leads + 12 closed deals)
```

### 4. Dev

```bash
pnpm dev
```

---

## Scripts

| Command           | What                                  |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Next.js dev server                    |
| `pnpm build`      | Production build                      |
| `pnpm start`      | Start production server               |
| `pnpm lint`       | ESLint                                |
| `pnpm typecheck`  | `tsc --noEmit`                        |
| `pnpm db:generate`| Generate Prisma client                |
| `pnpm db:push`    | Push schema to Neon (no migration)    |
| `pnpm db:migrate` | Create + run a migration              |
| `pnpm db:studio`  | Prisma Studio                         |
| `pnpm db:seed`    | Seed demo leads + closed deals        |

---

## Project layout

```
src/
  app/             # Next App Router — routes, layouts, api
  components/      # Reusable React components
    ui/            # shadcn/ui primitives
  lib/             # prisma client, env, auth, groq, resend, utils
  hooks/           # React hooks
  types/           # Shared TS types
prisma/
  schema.prisma    # Models: User, Lead, Application, Document,
                   #         Interaction, EmailTemplate, ScoringConfig
  seed.ts          # Demo data seeder
```

---

## License

Proprietary — © Umer / Digital Point LLC.
