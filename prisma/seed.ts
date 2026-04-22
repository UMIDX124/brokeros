/* eslint-disable no-console */
import {
  PrismaClient,
  UserRole,
  LeadStatus,
  LoanProduct,
  CreditScoreRange,
  DocumentType,
  InteractionType,
  InteractionDirection,
  EmailTrigger,
  type Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { leads as demoLeads, PRODUCT_LABEL } from "../src/lib/demo/data";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@brokeros.app";
const DEMO_PASSWORD = "Demo1234!";

const STATUS_TO_PRISMA: Record<string, LeadStatus> = {
  NEW: LeadStatus.NEW,
  CONTACTED: LeadStatus.CONTACTED,
  QUALIFIED: LeadStatus.QUALIFIED,
  IN_APPLICATION: LeadStatus.IN_APPLICATION,
  CLOSED: LeadStatus.CLOSED,
  LOST: LeadStatus.LOST,
};

const PRODUCT_TO_PRISMA: Record<string, LoanProduct> = {
  SBA: LoanProduct.SBA,
  MCA: LoanProduct.MCA,
  EQUIPMENT: LoanProduct.EQUIPMENT,
  WORKING_CAPITAL: LoanProduct.WORKING_CAPITAL,
  LINE_OF_CREDIT: LoanProduct.LINE_OF_CREDIT,
};

const CREDIT_TO_PRISMA: Record<string, CreditScoreRange> = {
  UNDER_600: CreditScoreRange.UNDER_600,
  SCORE_600_649: CreditScoreRange.SCORE_600_649,
  SCORE_650_699: CreditScoreRange.SCORE_650_699,
  SCORE_700_749: CreditScoreRange.SCORE_700_749,
  SCORE_750_PLUS: CreditScoreRange.SCORE_750_PLUS,
  UNKNOWN: CreditScoreRange.UNKNOWN,
};

/** Extra closed-won deals tuned so closed total ≈ $284K (seeded from data.ts already has ~$710K closed; we add small deals and cap display to pipeline total). */
const extraClosed = [
  {
    id: "L-0901",
    businessName: "Juniper Yoga Studio",
    ownerName: "Priya Shah",
    email: "priya@juniperyoga.com",
    phone: "(512) 555-0177",
    industry: "Fitness",
    product: LoanProduct.WORKING_CAPITAL,
    loanAmount: 22_000,
    monthlyRevenue: 18_000,
    timeInBusinessMonths: 42,
    creditScoreRange: CreditScoreRange.SCORE_700_749,
    loanPurpose: "Studio refresh + marketing",
    score: 82,
    scoreReason: "Steady studio, healthy cashflow, clean credit.",
    status: LeadStatus.CLOSED,
    source: "Referral",
    state: "TX",
    daysAgo: 62,
  },
  {
    id: "L-0902",
    businessName: "Rio Grande Plumbing",
    ownerName: "Hector Mendoza",
    email: "hector@riograndeplumb.com",
    phone: "(915) 555-0118",
    industry: "Construction & trades",
    product: LoanProduct.EQUIPMENT,
    loanAmount: 38_000,
    monthlyRevenue: 41_000,
    timeInBusinessMonths: 96,
    creditScoreRange: CreditScoreRange.SCORE_700_749,
    loanPurpose: "New service van + tooling",
    score: 88,
    scoreReason: "Long-tenured trades shop, equipment deal.",
    status: LeadStatus.CLOSED,
    source: "Website form",
    state: "TX",
    daysAgo: 55,
  },
  {
    id: "L-0903",
    businessName: "Magnolia Bakery Co.",
    ownerName: "Clara Dubois",
    email: "clara@magnoliabake.com",
    phone: "(225) 555-0149",
    industry: "Food & beverage",
    product: LoanProduct.WORKING_CAPITAL,
    loanAmount: 28_000,
    monthlyRevenue: 22_000,
    timeInBusinessMonths: 54,
    creditScoreRange: CreditScoreRange.SCORE_650_699,
    loanPurpose: "Second POS + inventory",
    score: 78,
    scoreReason: "Solid bakery with recurring revenue.",
    status: LeadStatus.CLOSED,
    source: "Google Ads",
    state: "LA",
    daysAgo: 48,
  },
];

async function seedUser() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, role: UserRole.OWNER, name: "Umer (demo)" },
    create: {
      email: DEMO_EMAIL,
      name: "Umer (demo)",
      passwordHash,
      role: UserRole.OWNER,
    },
  });
  console.log(`✓ Demo user ready: ${user.email} / ${DEMO_PASSWORD} (role ${user.role})`);
}

async function seedScoringConfig() {
  await prisma.scoringConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      highScoreThreshold: 70,
      qualifiedThreshold: 50,
      minMonthlyRevenue: 10_000,
      minTimeInBusinessMos: 6,
    },
  });
  console.log("✓ ScoringConfig upserted");
}

async function seedTemplates() {
  const rows: Array<{ name: string; trigger: EmailTrigger; subject: string; body: string }> = [
    {
      name: "Welcome + docs request (hot)",
      trigger: EmailTrigger.LEAD_HIGH_SCORE,
      subject: "Welcome to BrokerOS — next steps for your {{loan_amount}} request",
      body: "Hi {{first_name}},\n\nThanks for applying for funding for {{business_name}}. You scored {{score}}/100.\n\nNext steps:\n  1. Upload 3 months bank statements + most recent tax return\n  2. A broker will call within 1 business day\n  3. Soft offers within 48-72 hours\n\n— BrokerOS",
    },
    {
      name: "Document request (standard)",
      trigger: EmailTrigger.LEAD_DOCS_REQUEST,
      subject: "Documents needed to move forward — {{business_name}}",
      body: "Hi {{first_name}},\n\nTo finalize lender matching, please upload:\n• Last 3 months business bank statements\n• Most recent business tax return\n• Voided check for the operating account\n\n— BrokerOS",
    },
    {
      name: "Follow-up (warm cold)",
      trigger: EmailTrigger.LEAD_FOLLOWUP,
      subject: "Still interested in funding for {{business_name}}?",
      body: "Hi {{first_name}},\n\nHaven't heard back — are you still looking at options? A quick reply helps us match the right lender.\n\n— BrokerOS",
    },
  ];

  for (const r of rows) {
    const existing = await prisma.emailTemplate.findFirst({ where: { name: r.name } });
    if (existing) {
      await prisma.emailTemplate.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.emailTemplate.create({ data: r });
    }
  }
  console.log(`✓ Email templates seeded (${rows.length})`);
}

function daysAgoDate(days: number, hour = 10, minute = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedDemoLeads() {
  let inserted = 0;
  let skipped = 0;

  for (const l of demoLeads) {
    const existing = await prisma.lead.findFirst({ where: { email: l.email } });
    if (existing) {
      skipped++;
      continue;
    }
    const createdAt = new Date(l.createdAt);
    const updatedAt = new Date(l.updatedAt);

    const lead = await prisma.lead.create({
      data: {
        businessName: l.businessName,
        ownerName: l.ownerName,
        email: l.email,
        phone: l.phone,
        loanAmount: l.loanAmount,
        monthlyRevenue: l.monthlyRevenue,
        timeInBusinessMonths: l.timeInBusinessMonths,
        industry: l.industry,
        loanPurpose: l.loanPurpose,
        creditScoreRange: CREDIT_TO_PRISMA[l.creditScoreRange] ?? CreditScoreRange.UNKNOWN,
        product: PRODUCT_TO_PRISMA[l.product] ?? LoanProduct.WORKING_CAPITAL,
        score: l.score,
        scoreReason: l.scoreReason,
        scoredAt: createdAt,
        status: STATUS_TO_PRISMA[l.status] ?? LeadStatus.NEW,
        source: l.source,
        metadata: { state: l.state, city: l.city } satisfies Prisma.JsonObject,
        createdAt,
        updatedAt,
      },
    });

    await seedLeadTimeline(lead.id, createdAt, updatedAt, l.score, l.status, l.ownerName);
    if (l.status !== "NEW" && l.status !== "CONTACTED") {
      await seedLeadDocuments(lead.id, updatedAt);
    }

    if (l.status === "CLOSED") {
      await prisma.application.create({
        data: {
          leadId: lead.id,
          stage: "FUNDED",
          lenderMatch: "Partner Bank",
          fundedAmount: l.loanAmount,
          commissionBps: 250,
          createdAt,
          updatedAt,
        },
      });
    } else if (l.status === "IN_APPLICATION") {
      await prisma.application.create({
        data: {
          leadId: lead.id,
          stage: "UNDERWRITING",
          createdAt,
          updatedAt,
        },
      });
    }

    inserted++;
  }
  console.log(`✓ Demo leads: inserted ${inserted}, skipped ${skipped} (already present)`);
}

async function seedLeadTimeline(
  leadId: string,
  createdAt: Date,
  updatedAt: Date,
  score: number,
  status: string,
  ownerName: string,
) {
  const baseMs = createdAt.getTime();
  const mins = (n: number) => new Date(baseMs + n * 60_000);

  const rows: Prisma.InteractionCreateManyInput[] = [
    {
      leadId,
      type: InteractionType.AI_ACTION,
      direction: InteractionDirection.INTERNAL,
      subject: "Lead scored",
      content: `AI underwriter scored this lead ${score}/100.`,
      createdAt: mins(2),
    },
  ];

  if (score >= 70) {
    rows.push({
      leadId,
      type: InteractionType.EMAIL,
      direction: InteractionDirection.OUTBOUND,
      subject: "Welcome + document request",
      content: "Branded welcome email sent automatically (high-score trigger).",
      createdAt: mins(3),
      outcome: "sent",
    });
  }

  if (status !== "NEW") {
    rows.push({
      leadId,
      type: InteractionType.CALL,
      direction: InteractionDirection.OUTBOUND,
      subject: "Intro call",
      content: `Called ${ownerName} — discussed the application and next docs.`,
      createdAt: mins(60 * 4),
      outcome: "connected",
    });
  }

  if (status === "QUALIFIED" || status === "IN_APPLICATION" || status === "CLOSED") {
    rows.push({
      leadId,
      type: InteractionType.EMAIL,
      direction: InteractionDirection.INBOUND,
      subject: "Re: Documents",
      content: "Uploaded bank statements and tax return.",
      createdAt: mins(60 * 30),
    });
  }

  rows.push({
    leadId,
    type: InteractionType.STATUS_CHANGE,
    direction: InteractionDirection.INTERNAL,
    content: `Status updated to ${status}.`,
    createdAt: updatedAt,
  });

  await prisma.interaction.createMany({ data: rows });
}

async function seedLeadDocuments(leadId: string, updatedAt: Date) {
  const base = updatedAt.getTime();
  await prisma.document.createMany({
    data: [
      {
        leadId,
        type: DocumentType.BANK_STATEMENT,
        filename: "bank-statement-feb-2026.pdf",
        url: `https://docs.brokeros.app/${leadId}/bank-feb.pdf`,
        sizeBytes: 412_300,
        uploadedAt: new Date(base - 86_400_000 * 3),
      },
      {
        leadId,
        type: DocumentType.TAX_RETURN,
        filename: "form-1120s-2024.pdf",
        url: `https://docs.brokeros.app/${leadId}/tax-2024.pdf`,
        sizeBytes: 2_104_860,
        uploadedAt: new Date(base - 86_400_000 * 2),
      },
      {
        leadId,
        type: DocumentType.VOIDED_CHECK,
        filename: "voided-check-operating.jpg",
        url: `https://docs.brokeros.app/${leadId}/voided.jpg`,
        sizeBytes: 184_200,
        uploadedAt: new Date(base - 86_400_000 * 1),
      },
    ],
  });
}

async function seedExtraClosed() {
  let inserted = 0;
  for (const c of extraClosed) {
    const existing = await prisma.lead.findFirst({ where: { email: c.email } });
    if (existing) continue;
    const createdAt = daysAgoDate(c.daysAgo);
    const updatedAt = daysAgoDate(c.daysAgo - 7);

    const lead = await prisma.lead.create({
      data: {
        businessName: c.businessName,
        ownerName: c.ownerName,
        email: c.email,
        phone: c.phone,
        loanAmount: c.loanAmount,
        monthlyRevenue: c.monthlyRevenue,
        timeInBusinessMonths: c.timeInBusinessMonths,
        industry: c.industry,
        loanPurpose: c.loanPurpose,
        creditScoreRange: c.creditScoreRange,
        product: c.product,
        score: c.score,
        scoreReason: c.scoreReason,
        scoredAt: createdAt,
        status: c.status,
        source: c.source,
        metadata: { state: c.state } satisfies Prisma.JsonObject,
        createdAt,
        updatedAt,
      },
    });
    await seedLeadTimeline(lead.id, createdAt, updatedAt, c.score, "CLOSED", c.ownerName);
    await seedLeadDocuments(lead.id, updatedAt);
    await prisma.application.create({
      data: {
        leadId: lead.id,
        stage: "FUNDED",
        lenderMatch: "Partner Bank",
        fundedAmount: c.loanAmount,
        commissionBps: 250,
        createdAt,
        updatedAt,
      },
    });
    inserted++;
  }
  console.log(`✓ Extra closed-won leads inserted: ${inserted}`);
}

async function seedWorkflows() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    console.warn("⚠ demo user missing, skipping workflow seed");
    return;
  }

  const templates: Array<{
    name: string;
    description: string;
    trigger: Prisma.InputJsonValue;
    nodes: Prisma.InputJsonValue;
    edges: Prisma.InputJsonValue;
  }> = [
    {
      name: "Hot Lead Alert",
      description: "When a lead scores HOT, ping the broker on Slack + SMS immediately.",
      trigger: { type: "LEAD_SCORED", config: { minScore: 85, tier: "HOT" } },
      nodes: [
        {
          id: "t",
          type: "TRIGGER_LEAD_SCORED",
          position: { x: 120, y: 40 },
          data: { nodeType: "TRIGGER_LEAD_SCORED", label: "Lead scored ≥ 85" },
        },
        {
          id: "slack",
          type: "SLACK_NOTIFY",
          position: { x: 40, y: 220 },
          data: {
            nodeType: "SLACK_NOTIFY",
            label: "Ping #hot-leads",
            webhookUrl: "",
            text: "🔥 HOT lead — {{lead.businessName}} ({{lead.ownerName}}) scored {{trigger.score}}. Amount: {{lead.loanAmount}}.",
          },
        },
        {
          id: "sms",
          type: "SEND_SMS",
          position: { x: 260, y: 220 },
          data: {
            nodeType: "SEND_SMS",
            label: "SMS broker",
            to: "+15125550100",
            body: "Hot lead: {{lead.businessName}} — {{trigger.score}}/100. Log in to review.",
          },
        },
      ],
      edges: [
        { id: "e1", source: "t", target: "slack" },
        { id: "e2", source: "t", target: "sms" },
      ],
    },
    {
      name: "60-day Drip Sequence",
      description: "Welcome + 3 timed follow-ups. If no contact after 14 days, SMS nudge.",
      trigger: { type: "LEAD_CREATED", config: {} },
      nodes: [
        {
          id: "t",
          type: "TRIGGER_LEAD_CREATED",
          position: { x: 160, y: 40 },
          data: { nodeType: "TRIGGER_LEAD_CREATED", label: "Lead created" },
        },
        {
          id: "e1",
          type: "SEND_EMAIL",
          position: { x: 160, y: 180 },
          data: {
            nodeType: "SEND_EMAIL",
            label: "Welcome email",
            to: "{{lead.email}}",
            subject: "Welcome, {{lead.ownerName}} — next steps for {{lead.businessName}}",
            body: "Hi {{lead.ownerName}},\n\nThanks for applying for funding for {{lead.businessName}}. A broker will reach out within 1 business day.\n\n— BrokerOS",
          },
        },
        {
          id: "w1",
          type: "WAIT",
          position: { x: 160, y: 340 },
          data: { nodeType: "WAIT", label: "Wait 2 days", amount: 2, unit: "days" },
        },
        {
          id: "e2",
          type: "SEND_EMAIL",
          position: { x: 160, y: 480 },
          data: {
            nodeType: "SEND_EMAIL",
            label: "Follow-up 1",
            to: "{{lead.email}}",
            subject: "Any questions on your {{lead.businessName}} application?",
            body: "Hi {{lead.ownerName}},\n\nJust checking in — anything we can answer before you submit docs?\n\n— BrokerOS",
          },
        },
        {
          id: "w2",
          type: "WAIT",
          position: { x: 160, y: 640 },
          data: { nodeType: "WAIT", label: "Wait 5 days", amount: 5, unit: "days" },
        },
        {
          id: "e3",
          type: "SEND_EMAIL",
          position: { x: 160, y: 780 },
          data: {
            nodeType: "SEND_EMAIL",
            label: "Follow-up 2",
            to: "{{lead.email}}",
            subject: "Still looking at funding options?",
            body: "Hi {{lead.ownerName}},\n\nRate environment changes weekly. Worth 10 minutes to review lender options together?\n\n— BrokerOS",
          },
        },
        {
          id: "w3",
          type: "WAIT",
          position: { x: 160, y: 940 },
          data: { nodeType: "WAIT", label: "Wait 7 days", amount: 7, unit: "days" },
        },
        {
          id: "cond",
          type: "CONDITION",
          position: { x: 160, y: 1080 },
          data: {
            nodeType: "CONDITION",
            label: "Ever contacted?",
            left: "{{lead.status}}",
            op: "neq",
            right: "CONTACTED",
          },
        },
        {
          id: "sms",
          type: "SEND_SMS",
          position: { x: 40, y: 1240 },
          data: {
            nodeType: "SEND_SMS",
            label: "SMS nudge",
            to: "{{lead.phone}}",
            body: "Hi {{lead.ownerName}}, BrokerOS here. Quick Q — still open to loan options?",
          },
        },
      ],
      edges: [
        { id: "e1", source: "t", target: "e1" },
        { id: "e2", source: "e1", target: "w1" },
        { id: "e3", source: "w1", target: "e2" },
        { id: "e4", source: "e2", target: "w2" },
        { id: "e5", source: "w2", target: "e3" },
        { id: "e6", source: "e3", target: "w3" },
        { id: "e7", source: "w3", target: "cond" },
        { id: "e8", source: "cond", target: "sms", sourceHandle: "true" },
      ],
    },
    {
      name: "Document Request",
      description: "When a lead hits QUALIFIED, request docs. If still no docs in 3 days, SMS reminder.",
      trigger: { type: "LEAD_STATUS_CHANGED", config: { toStatus: "QUALIFIED" } },
      nodes: [
        {
          id: "t",
          type: "TRIGGER_LEAD_STATUS_CHANGED",
          position: { x: 160, y: 40 },
          data: { nodeType: "TRIGGER_LEAD_STATUS_CHANGED", label: "Status → QUALIFIED" },
        },
        {
          id: "docs",
          type: "SEND_EMAIL",
          position: { x: 160, y: 200 },
          data: {
            nodeType: "SEND_EMAIL",
            label: "Request docs",
            to: "{{lead.email}}",
            subject: "Documents needed — {{lead.businessName}}",
            body: "Hi {{lead.ownerName}},\n\nTo match you with a lender, please upload:\n  • Last 3 months bank statements\n  • Most recent business tax return\n  • Voided check for operating account\n\nReply to this email if you have questions.\n\n— BrokerOS",
          },
        },
        {
          id: "log",
          type: "CREATE_INTERACTION",
          position: { x: 160, y: 360 },
          data: {
            nodeType: "CREATE_INTERACTION",
            label: "Log request",
            type: "EMAIL",
            direction: "OUTBOUND",
            subject: "Document request sent",
            content: "Automated document request email sent to {{lead.email}}.",
            outcome: "sent",
          },
        },
        {
          id: "wait",
          type: "WAIT",
          position: { x: 160, y: 520 },
          data: { nodeType: "WAIT", label: "Wait 3 days", amount: 3, unit: "days" },
        },
        {
          id: "sms",
          type: "SEND_SMS",
          position: { x: 160, y: 660 },
          data: {
            nodeType: "SEND_SMS",
            label: "SMS reminder",
            to: "{{lead.phone}}",
            body: "Hi {{lead.ownerName}}, BrokerOS — friendly reminder on your docs for {{lead.businessName}}.",
          },
        },
      ],
      edges: [
        { id: "e1", source: "t", target: "docs" },
        { id: "e2", source: "docs", target: "log" },
        { id: "e3", source: "log", target: "wait" },
        { id: "e4", source: "wait", target: "sms" },
      ],
    },
    {
      name: "Cold Re-engagement",
      description: "Weekly: pick up a stale lead and send a personalized AI-written nudge.",
      trigger: { type: "SCHEDULE_CRON", config: { cron: "0 15 * * 1" } },
      nodes: [
        {
          id: "t",
          type: "TRIGGER_SCHEDULE_CRON",
          position: { x: 160, y: 40 },
          data: { nodeType: "TRIGGER_SCHEDULE_CRON", label: "Mondays 10am CT", cron: "0 15 * * 1" },
        },
        {
          id: "gen",
          type: "GROQ_GENERATE",
          position: { x: 160, y: 200 },
          data: {
            nodeType: "GROQ_GENERATE",
            label: "Write nudge",
            system: "You are a concise, professional US small-business loan broker writing a re-engagement email. 3 sentences max.",
            prompt: "Write a friendly re-engagement email to {{lead.ownerName}} at {{lead.businessName}}. They previously requested {{lead.loanAmount}} for {{lead.loanPurpose}} but went quiet. Mention rates changed recently and ask if they're still open.",
            temperature: 0.6,
            maxTokens: 300,
          },
        },
        {
          id: "send",
          type: "SEND_EMAIL",
          position: { x: 160, y: 380 },
          data: {
            nodeType: "SEND_EMAIL",
            label: "Send nudge",
            to: "{{lead.email}}",
            subject: "Quick check-in on {{lead.businessName}}",
            body: "{{steps.gen.text}}",
          },
        },
      ],
      edges: [
        { id: "e1", source: "t", target: "gen" },
        { id: "e2", source: "gen", target: "send" },
      ],
    },
  ];

  let inserted = 0;
  for (const tpl of templates) {
    const existing = await prisma.workflow.findFirst({
      where: { ownerId: user.id, name: tpl.name },
    });
    if (existing) continue;
    await prisma.workflow.create({
      data: {
        ownerId: user.id,
        name: tpl.name,
        description: tpl.description,
        enabled: true,
        trigger: tpl.trigger,
        nodes: tpl.nodes,
        edges: tpl.edges,
      },
    });
    inserted++;
  }
  console.log(`✓ Workflow templates seeded: ${inserted} new`);
}

async function main() {
  console.log("🌱 Seeding BrokerOS demo data…");
  await seedUser();
  await seedScoringConfig();
  await seedTemplates();
  await seedDemoLeads();
  await seedExtraClosed();
  await seedWorkflows();

  const totals = await prisma.lead.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log("📊 Lead totals by status:");
  for (const t of totals) {
    console.log(`  ${t.status}: ${t._count._all}`);
  }
  console.log(`\nDemo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Use dashboard: http://localhost:3000/dashboard`);
  void PRODUCT_LABEL; // keep import to avoid unused warning
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
