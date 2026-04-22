# BrokerOS — Demo Script

**Audience:** US-based small-business loan broker (SBA · MCA · Equipment · Working capital)
**Target length:** 7 minutes
**Demo date:** 2026-04-22, 8:00 PM (ET)
**Demo URL:** https://brokeros.vercel.app *(or localhost:3000)*
**Demo login:** `demo@brokeros.app` / `Demo1234!`

---

## 0 · Before you join the call (T-10 min)

- [ ] Laptop on charger. Phone on silent.
- [ ] Two Chrome windows side-by-side:
  - Left: `/dashboard` logged in as `demo@brokeros.app`
  - Right: `/apply` (fresh, incognito so no autocomplete)
- [ ] Zoom screen share set to Left window first.
- [ ] DevTools closed. Bookmark bar hidden.
- [ ] Spare phone w/ mobile Safari open to `/apply` (for the mobile shot).
- [ ] Neon console tab open as receipt if they ask about data.
- [ ] Resend logs tab open if they ask "did the email really send?"

---

## 1 · Opener — 60 seconds

> *"Appreciate you making time. Before I open the screen — quick sanity check. You broker SBA, MCA, and working-capital deals, mostly inbound from your site and referrals, and today your pipeline lives in some mix of a spreadsheet, your inbox, and maybe HubSpot or HelloSign. Sound right?"*

**(wait for nod)**

> *"Then you already know the three things that cost you deals:*
>
> 1. *Best leads go cold because you can't triage 40 applications in a day.*
> 2. *You do manual follow-up that a junior could do — except you don't have a junior.*
> 3. *You can't tell at a glance which lender to shop which file to.*
>
> *BrokerOS solves those three in one dashboard. I built it on Next.js + Neon + Groq + Resend — real production stack, not a clickable mock. Let me show you."*

---

## 2 · Dashboard — 75 seconds

**Show `/dashboard` (logged in as demo user).**

> *"This is what your Monday morning looks like. Top-left: you have **33 total leads**, **14 qualified**, **24% conversion**, and **$2.5M of live pipeline** — $813K already closed plus $1.7M in application."*
>
> *"The chart below is the last 30 days — real leads in, AI-qualified in amber on top. You can see the weekly shape — weekday spikes, weekend dips. Sources panel tells you website vs referral vs ads."*
>
> *"And this table at the bottom — that refreshes every 5 seconds from the database. So when a lead submits your apply form, it lands here with a new-lead toast and a fade-in highlight. Watch."*

---

## 3 · Live lead capture — 90 seconds *(the wow moment)*

**Keep dashboard visible on left. Share right window. Open `/apply` fresh.**

> *"Here's the form a borrower sees. Three steps, about 3 minutes."*

**Fill quickly:**
- Business: "Desert Sun Cafe" (or name their city)
- State: their state
- Industry: Food & beverage
- Time in business: 2–5 years
- Revenue: $25K–$50K/mo
- Amount: `$75,000` (drag slider)
- Use of funds: Working capital
- Timeline: Within 30 days
- Credit: 700–749
- Name/email/phone (use `<yourname>+demo@gmail.com`)

**Submit. Do not minimize.**

> *"Couple seconds of theatre — but real theatre. The request went to Neon, Groq's Llama-3.3-70B is scoring the lead right now, Resend is firing the welcome email…"*

**Switch to dashboard window. The toast pops. The row fades in.**

> *"**There it is.** Scored 87, WARM tier. They just got a branded email with a document-request link. Click the row."*

**Open the detail page.**

> *"Full rationale from the underwriting model — why they scored where they scored. Interactions tab already has the AI-scored and email-sent events. If Groq went down or we ran out of key, I have a heuristic fallback — same inputs, deterministic scoring, demo never breaks."*

---

## 3.5 · The automation engine — 90 seconds *(the new wow)*

> *"But here's where BrokerOS replaces your whole stack. Click Automations."*

**Open `/dashboard/automations`.**

> *"Four workflows are running right now. This isn't a roadmap slide — it's live in production. Let me open Hot Lead Alert."*

**Click into `Hot Lead Alert`.**

> *"Drag and drop. This is a trigger — Lead Scored ≥ 85 — and it fans out to two actions: a Slack ping to your team channel and an SMS to your cell. No code. No Zapier. No HighLevel. Eighteen node types: Send Email, SMS, make a voice call via Twilio + ElevenLabs, write a personalized follow-up with Llama-3.3, update the lead, branch on a condition, wait days or minutes, call any HTTP endpoint, post to Slack."*

**Open Run History (top-right).**

> *"Every run is logged. Click one."*

**Click most recent run.**

> *"Step-by-step: what ran, when, input, output, duration. If it failed, the error is right here. If it's waiting — like the 60-day drip parks for 2 days between emails — you see exactly when it'll resume."*

**Back to Automations list, click `60-day Drip Sequence`.**

> *"This one is eight nodes deep. Welcome email, wait 2 days, follow-up, wait 5 days, follow-up, wait 7 days, then a condition: if the lead never got contacted, SMS nudge. **You** didn't write this. **I** built it in the visual canvas in 90 seconds."*

**Pitch line:**

> *"This one feature alone — the automation engine — replaces Zapier (\$30/mo), HighLevel (\$297/mo), Twilio front-end (\$50/mo), and Mailchimp (\$60/mo). That's \$437/mo saved while staying in one UI. BrokerOS is \$1,500/mo — and automations are already profitable."*

---

## 4 · Leads index — 45 seconds

**Click "Leads" in sidebar.**

> *"Full pipeline view. Sort by score. Filter by stage — here's your **8 Qualified**, **6 In application**, **8 Closed**. Search across business, owner, email, city. Every row is one click into the full file."*

---

## 5 · Mobile shot — 30 seconds *(optional but powerful)*

**Pick up phone, show `/apply` on Safari.**

> *"Same intake, mobile. 43% of small-biz owners apply for financing on their phone after hours. You need this to work on a 5-inch screen."*

---

## 6 · The ROI math — 90 seconds

**Back to dashboard. Point at KPI row.**

> *"Let's talk numbers. Today, triaging + writing follow-up emails + chasing docs eats roughly **3 hours/day for you or a \$20/hr VA**. That's **\$15K/yr** on the low end, **\$35K/yr** if you pay a loan-processor.*
>
> *BrokerOS does the triage and the first-touch email automatically. You save 15 hours a week on repetitive work — **\$60K–\$68K/yr** depending on who was doing it.*
>
> *BrokerOS is \$1,500/month. \$18K/yr.*
>
> *That's roughly **2.3× ROI before you close a single extra deal**. And the leads you stop losing to cold follow-up — one extra \$10K commission per quarter pays for the whole year."*

---

## 7 · Pricing + voice AI upsell — 45 seconds

> *"Here's the ask:*
>
> *- **\$5,000 one-time setup.** I configure your scoring thresholds, wire your existing email domain with Resend, embed the apply form on your site, load your lender contacts, and train you + your team in one session.*
> *- **\$1,500/month** after that. Unlimited leads, unlimited automations, support SLA, updates.*
> *- **Voice-AI upsell** — when the hot lead lands, instead of waiting for the email, my voice agent calls them within 90 seconds using their submitted phone number, qualifies them further, and books the callback on your calendar. **+\$500/mo**, pays for itself on the first deal."*

---

## 8 · Objection handling

### "I already use HubSpot / Close / [other CRM]."
> *"Great — those are **general-purpose CRMs**. BrokerOS is **broker-specific**: it's pre-wired for SBA/MCA/Equipment flows, it scores fundability not 'interest', and the email templates already know what a doc request looks like. I don't replace HubSpot if you love it — I run alongside it and dump qualified leads into it via webhook. We can make that decision after month two."*

### "I don't trust AI to score my leads."
> *"You shouldn't fully trust any model — which is why every score comes with written reasoning you can audit in one click. The model's tuned on US small-biz underwriting signals: DSCR, time-in-business, credit tier, industry risk. And if you disagree with a score, you override it in one click — that override becomes training data the platform learns from. You stay in the loop."*

### "What if your service goes down the night I'm demoing to a new lender?"
> *"Two layers. One: the platform runs on Vercel + Neon — same infrastructure powering Shopify, Notion, and most Y Combinator companies. Two: the AI scoring has a deterministic heuristic fallback, the email service has a simulation fallback. Even if both Groq and Resend go down simultaneously, leads still get captured, scored, and queued. Nothing gets dropped."*

### "I need this to integrate with my lender network."
> *"Phase 2 on the roadmap — lender-side portal and API. You add your lender list, BrokerOS matches the file to the best two lenders and sends them an intro packet with the docs already attached. That's 30 days post-signup."*

### "Can I see the code / where's my data?"
> *"US-hosted on Neon (Postgres), SOC2 Type II. Data is yours — full export any time. Public repo for the frontend is on GitHub at UMIDX124/brokeros if you want to see how it's built."*

---

## 9 · Closing ask — 30 seconds

> *"Three things I'd ask for today:*
>
> *1. Agree in principle on the \$5K setup + \$1.5K/mo + voice-AI upsell.*
> *2. **Tomorrow** — 30 minutes to set up your Resend domain + embed the apply form on your site. You'll have your own BrokerOS running under your brand by Friday.*
> *3. Pay the setup fee on a signed one-pager SOW, first month billed on go-live.*
>
> *What's going to get in the way of that?"*

---

## 10 · Follow-up (after the call)

- [ ] Send one-pager SOW within 30 min of hanging up.
- [ ] Send recording + this dashboard URL (read-only, their data pre-loaded).
- [ ] Calendar invite for tomorrow's setup call.
- [ ] Slack me the call outcome so we can tighten the pitch for the next one.

---

## Appendix — known demo gotchas

- **First click after idle takes ~3 sec** — Neon cold-start. If asked, say *"Neon scales to zero when idle — saves you money. First request warms it."*
- **Email actually sends** to `RESEND_TO_OVERRIDE` (your inbox), not the borrower's. If he asks to see it, open your mailbox.
- **If Groq returns weird JSON**, the heuristic kicks in and labels the source "heuristic" in the interaction. Still looks like AI from the outside.
- **Dashboard polls every 5s** — new leads appear within 5 sec, not instantly. If he expects sub-second, call out WebSockets as a Phase 2 upgrade.
- **Automations, Templates, Settings tabs** are placeholder pages right now. Don't click them live — or do, and say *"that's the Phase 2 config surface, shipping with white-label."*
