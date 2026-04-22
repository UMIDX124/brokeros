# BrokerOS

> The AI-powered operating system for modern loan brokers.

Capture leads, AI-score them the second they land, auto-send a branded welcome + document request, and watch your pipeline populate — all from one live dashboard. Built for US brokers originating **SBA, MCA, equipment, and working-capital** loans.

![Hearth Mode — no purple, no indigo, warm amber + navy](./.github/hero.png) <!-- optional, add later -->

---

## What it actually does (live, today)

| Capability | Status | Where to look |
|---|---|---|
| Public multi-step apply form | ✅ Live | [/apply](/apply) |
| Groq Llama-3.3-70B lead scoring (w/ 3-attempt retry + heuristic fallback) | ✅ Live | [`src/lib/ai/score-lead.ts`](src/lib/ai/score-lead.ts) |
| Branded Resend welcome email for HOT/WARM leads (w/ simulation fallback) | ✅ Live | [`src/lib/email/send-welcome.ts`](src/lib/email/send-welcome.ts) |
| Live dashboard with 5-sec polling, toast on new lead, KPIs from DB | ✅ Live | [/dashboard](/dashboard) |
| Leads table — search, sort, status filter pills | ✅ Live | [/dashboard/leads](/dashboard/leads) |
| Lead detail w/ tabs: Overview, Documents, Interactions, Timeline | ✅ Live | [/dashboard/leads/[id]](/dashboard/leads) |
| NextAuth v5: email+password + Resend magic link | ✅ Live | [/login](/login) |
| Email templates, automations, settings pages | 🟡 Phase 2 | placeholder screens |
| Lender matching + document OCR | ⚪ Roadmap | — |

---

## Demo credentials

After running `pnpm db:seed`:

- **Login:** `demo@brokeros.app`
- **Password:** `Demo1234!`
- **Role:** `OWNER` (can see everything)

The seed also creates **33 realistic US small-biz leads** across SBA / MCA / equipment / working-capital, **14 applications**, **72 documents**, **147 interactions**, and **3 email templates** — enough for a demo that reads like a real production system.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, Node runtime) |
| Language | TypeScript (strict + `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 + shadcn/ui `new-york` (Hearth Mode theme) |
| ORM / DB | Prisma 6 + Neon PostgreSQL |
| Auth | NextAuth v5 (credentials + Prisma adapter + Resend magic link) |
| AI | Groq SDK — `llama-3.3-70b-versatile` (w/ heuristic fallback) |
| Email | Resend (w/ console-log fallback) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Hosting | Vercel |
| Package manager | pnpm — never npm |

### Design — "Hearth Mode"

Intentional warmth — not generic fintech blue.

| Token | Hex | Purpose |
|---|---|---|
| primary | `#1A1A2E` | Deep navy-black — trust |
| accent | `#F4A261` | Warm amber — primary CTA |
| success | `#06A77D` | Sage green — money-positive |
| destructive | `#C44536` | Warm red |
| background | `#FAF8F5` | Warm off-white |
| surface | `#FFFFFF` | Cards |

Fonts: **Inter** (UI) + **JetBrains Mono** (numbers / KPIs via the `.font-stat` utility).

---

## Quick start

```bash
# 1. Clone + install
git clone git@github.com:UMIDX124/brokeros.git
cd brokeros
pnpm install

# 2. Env — copy then fill DATABASE_URL, NEXTAUTH_SECRET, etc.
cp .env.example .env.local

# 3. Apply schema + seed demo data
pnpm prisma migrate deploy
pnpm db:seed                      # 33 leads, demo@brokeros.app / Demo1234!

# 4. Dev
pnpm dev                          # http://localhost:3000
```

**No Groq key?** The heuristic scorer takes over automatically.
**No Resend key?** Emails are simulated in console + logged to the lead's interaction timeline.
The demo never breaks.

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server (Turbopack, hot reload) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to Neon without a migration |
| `pnpm db:migrate` | Create + apply a new migration |
| `pnpm db:studio` | Prisma Studio (visual DB explorer) |
| `pnpm db:seed` | Seed 33 demo leads + demo user |

---

## Project layout

```
src/
  app/
    (marketing)/           # /, in-brand landing
    (auth)/                # /login, /register, /forgot-password
    apply/                 # Public 3-step wizard + success page
    dashboard/
      leads/[id]/          # Lead detail w/ tabs
      leads/               # Pipeline index
      ...                  # Automations, templates, settings (Phase 2)
    api/
      auth/                # NextAuth handlers + /register
      leads/               # POST (capture), /recent, /kpi
  components/
    marketing/             # Site header / footer
    apply/                 # Wizard + 3 step components
    dashboard/             # Sidebar, topbar, KPIs, charts, tables
    auth/                  # Login / register / forgot forms
    ui/                    # shadcn primitives
  lib/
    ai/score-lead.ts       # Groq + heuristic fallback
    email/send-welcome.ts  # Resend + simulation fallback
    leads/schema.ts        # Shared Zod for /apply + /api/leads
    demo/data.ts           # 30 hand-crafted seed leads
    auth.ts                # NextAuth v5 config
    prisma.ts              # Prisma client singleton
    env.ts                 # Zod-validated env
  proxy.ts                 # Next 16 middleware — fast /dashboard gate
prisma/
  schema.prisma            # User, Lead, Application, Document,
                           # Interaction, EmailTemplate, ScoringConfig
  migrations/              # `init` migration, applied on Neon
  seed.ts                  # `pnpm db:seed`
```

---

## Fallbacks — why the demo never breaks

| Service | When it fails | What happens |
|---|---|---|
| **Groq** | Missing/placeholder key or 3 consecutive API errors | Heuristic scorer (DSCR × tenure × credit) returns a 0–100 score with written reasoning. Interaction logged with `source: heuristic`. |
| **Resend** | Missing/placeholder key or API error | Email is **simulated** — full payload logged to console, interaction logged with `outcome: simulated`. Borrower's timeline still tells the "email sent" story for the demo. |
| **Neon** | Cold-start after idle (first request ~3-5s) | Request eventually succeeds. Subsequent requests are instant. |

Test both fallbacks any time with:

```bash
SKIP_ENV_VALIDATION=true GROQ_API_KEY= RESEND_API_KEY= pnpm tsx -e '
  import { scoreHeuristic } from "./src/lib/ai/score-lead";
  console.log(scoreHeuristic({ … }));
'
```

---

## Docs

| File | Contents |
|---|---|
| [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) | 7-minute pitch, ROI math, objection handling, closing ask |
| [`DEPLOY.md`](DEPLOY.md) | Vercel env vars + deploy + custom domain + rollback |
| [`CLAUDE.md`](CLAUDE.md) | Agent behavior rules for this repo |

---

## License

Proprietary — © Umer / Digital Point LLC.
