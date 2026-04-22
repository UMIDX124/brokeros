# BrokerOS — Deploy guide (Vercel)

> End state: `brokeros.vercel.app` (or your custom domain) running on Next.js 16 + Neon + Groq + Resend, auto-deploying on every push to `main`.

---

## 1 · One-time setup

### 1.1 Prerequisites

| Account | Used for | Signup |
|---|---|---|
| **GitHub** (`UMIDX124`) | Source of truth | already done |
| **Vercel** (team: `umidx124`) | Hosting + CDN + edge | already linked via `vercel link` |
| **Neon** | Postgres | already provisioned (`brokeros-db`) |
| **Groq** | AI scoring | https://console.groq.com/keys |
| **Resend** | Transactional email | https://resend.com/api-keys |

### 1.2 Verify the repo is connected

```bash
cd ~/Projects/_services/brokeros
pnpm dlx vercel link --yes --project brokeros
# → "Linked to umidx124s-projects/brokeros"
# → GitHub repo auto-connected
```

Check in the Vercel dashboard:
https://vercel.com/umidx124s-projects/brokeros/settings/git — should say *Production branch: `main`* and the GitHub integration active.

---

## 2 · Environment variables

Set these in **Vercel dashboard → Project → Settings → Environment Variables**, for all three environments (Production, Preview, Development).

### 2.1 Required

| Key | Where to get it | Example / notes |
|---|---|---|
| `DATABASE_URL` | Neon console → **Pooled** connection string | `postgresql://…-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Neon console → **Direct** connection (remove `-pooler`) | used by `prisma migrate` only |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | 32 bytes of random |
| `AUTH_SECRET` | Same value as `NEXTAUTH_SECRET` | NextAuth v5 alias |
| `NEXTAUTH_URL` | `https://brokeros.vercel.app` (or custom) | production URL |
| `AUTH_URL` | Same as `NEXTAUTH_URL` | NextAuth v5 alias |
| `APP_URL` | Same as `NEXTAUTH_URL` | used by email-link builder |

### 2.2 For Phase 4 automation (**not** strictly required — fallbacks kick in)

| Key | Effect when present | Effect when missing |
|---|---|---|
| `GROQ_API_KEY` | Scoring uses Llama-3.3-70B with 3-attempt retry | Heuristic DSCR-based scorer takes over; interactions logged with source = `heuristic` |
| `GROQ_MODEL` | Override model (default `llama-3.3-70b-versatile`) | Uses default |
| `RESEND_API_KEY` | Real welcome emails sent via Resend | Emails are *simulated* — payload logged, interaction marked `simulated=true` |
| `AUTH_RESEND_KEY` | NextAuth magic-link (`/forgot-password`) works | Magic-link flow disabled; credentials login still works |
| `RESEND_FROM_EMAIL` | From address (default `onboarding@resend.dev`) | Uses default |
| `RESEND_TO_OVERRIDE` | **Demo safety** — all welcome emails go to this inbox instead of the borrower's | Emails go to the real borrower address |

> **Demo config recommendation:** set `RESEND_TO_OVERRIDE=backupsolutions1122@gmail.com` in Preview/Production until you're ready to email real borrowers.

### 2.3 Pushing env vars (CLI alternative)

If you'd rather script it, `vercel env add KEY production` prompts for the value. Dashboard is faster the first time.

```bash
# Example — repeat per key per environment
npm_config_engine_strict=false pnpm dlx vercel env add DATABASE_URL production
```

---

## 3 · Deploy

### 3.1 Trigger a deploy

Pick one of:

- **Easiest** — push to `main`. Vercel auto-deploys.
  ```bash
  git push origin main
  ```
- **From the dashboard** — https://vercel.com/umidx124s-projects/brokeros/deployments → *Deploy* button.
- **CLI** — `npm_config_engine_strict=false pnpm dlx vercel --prod`

### 3.2 Watch the build

https://vercel.com/umidx124s-projects/brokeros/deployments → latest deployment → **Build Logs**

Expected build output tail:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/auth/register
├ ƒ /api/leads
├ ƒ /api/leads/kpi
├ ƒ /api/leads/recent
├ ○ /apply
├ ƒ /apply/success
├ ƒ /dashboard
├ ƒ /dashboard/automations
├ ƒ /dashboard/leads
├ ƒ /dashboard/leads/[id]
├ ƒ /dashboard/settings
├ ƒ /dashboard/templates
├ ○ /forgot-password
├ ○ /login
├ ○ /login/check-email
└ ○ /register
```

### 3.3 First post-deploy checks

| Check | How |
|---|---|
| Landing loads | `curl -I https://brokeros.vercel.app/` → 200 |
| Apply form loads | Open `/apply` in private window |
| Dashboard gated | `/dashboard` should redirect to `/login` unauth |
| DB reachable | Log in as `demo@brokeros.app` / `Demo1234!` — KPIs populate |
| Lead capture | Submit the apply form, watch the dashboard within 5s |

---

## 4 · Custom domain

1. In Vercel: **Project → Settings → Domains → Add** → e.g. `app.brokeros.io`.
2. Vercel shows the DNS record to add. Options:
   - **Apex (`brokeros.io`)** — A record to `76.76.21.21`
   - **Subdomain (`app.brokeros.io`)** — CNAME to `cname.vercel-dns.com`
3. Add the record in your registrar (Cloudflare / Namecheap / GoDaddy). Propagation is usually < 5 min.
4. Back in Vercel, wait for the green check. SSL cert auto-provisions in ~60 seconds.
5. **Update env vars** if you went custom domain:
   - `NEXTAUTH_URL` → `https://app.brokeros.io`
   - `AUTH_URL` → same
   - `APP_URL` → same
   - Redeploy to pick up new values.

---

## 5 · DB migrations on deploy

Prisma migrations are **not** auto-applied in CI. If you add a migration:

```bash
# Locally against Neon
set -a && source .env.local && set +a
pnpm prisma migrate dev --name add_column_xyz

# Then commit + push — Vercel rebuilds, but does NOT run migrations.
# Apply to production DB separately:
pnpm prisma migrate deploy
```

**Why this is safe:** Neon branches give you a zero-downtime path — create a branch for the migration, verify, then promote. For now we deploy against `main` directly because we're pre-launch.

---

## 6 · Rollback

Vercel keeps every deployment indefinitely. To roll back:

**Dashboard:** Deployments → find the last known-good → **Promote to Production**.
**CLI:** `vercel rollback <deployment-url>`.

This is instantaneous and does **not** require a rebuild.

DB rollbacks are harder. Neon supports **branch restore**: from the Neon console, restore the branch to a timestamp before the bad migration ran.

---

## 7 · Common issues

### 7.1 `P1001 Can't reach database server`

Neon free tier auto-suspends. First request after idle takes 3–10 sec. If seed/migrate fails with P1001:

```bash
# Warm the endpoint once, then retry
nc -zv ep-xxx.us-east-1.aws.neon.tech 5432
pnpm prisma migrate deploy
```

Fix permanently: upgrade Neon plan to disable auto-suspend, or add a lightweight cron ping.

### 7.2 `Invalid environment variables — see .env.example`

Vercel is missing a required env var. Check Vercel → Settings → Environment Variables against the list in §2.1. Redeploy after adding.

### 7.3 `28P01 password authentication failed`

You rotated the Neon password and forgot to update Vercel. Update `DATABASE_URL` + `DIRECT_URL` in Vercel, redeploy.

### 7.4 Welcome email never arrives

1. Check Resend dashboard → Logs → filter by `to = <borrower email>`.
2. If not there → `RESEND_API_KEY` is missing or wrong. Check Vercel env.
3. If there, status `bounced` → domain not verified. Point `RESEND_FROM_EMAIL` at a verified sender domain.
4. If there, status `sent` but not received → spam folder. Verify SPF/DKIM on your sending domain.

### 7.5 `Failed to run `prisma generate` during build`

Not all deploy platforms run the `postinstall` hook. If you see this on Vercel:
- Make sure `package.json#scripts.postinstall` is `prisma generate`.
- Alternative: add `prisma generate &&` in front of `build` in the Vercel project *Build Command* override.

---

## 8 · Go-live checklist

- [ ] All env vars set in Production
- [ ] `NEXTAUTH_URL` / `APP_URL` match the real domain
- [ ] Custom domain added + SSL cert green
- [ ] `RESEND_TO_OVERRIDE` **removed** (so emails actually reach borrowers)
- [ ] `RESEND_FROM_EMAIL` set to your verified domain (e.g. `apply@brokeros.io`)
- [ ] Demo user (`demo@brokeros.app / Demo1234!`) **deleted** or password rotated
- [ ] Smoke test: submit a real apply form, verify lead in dashboard within 5s, verify email in inbox
- [ ] Set up Vercel log drain → Datadog/Logtail (optional)
- [ ] Enable Vercel Web Analytics (optional)
