// Demo data used until the real DB-backed dashboard is wired in Phase 4.
// Numbers chosen to read believable to a US small-business broker:
// loan amounts $15k–$500k, avg deal ~$23k, revenue in normal SMB ranges.

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "IN_APPLICATION"
  | "CLOSED"
  | "LOST";

export type LoanProduct =
  | "SBA"
  | "MCA"
  | "EQUIPMENT"
  | "WORKING_CAPITAL"
  | "LINE_OF_CREDIT"
  | "OTHER";

export type DemoLead = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  industry: string;
  product: LoanProduct;
  loanAmount: number;
  monthlyRevenue: number;
  timeInBusinessMonths: number;
  creditScoreRange: "UNDER_600" | "SCORE_600_649" | "SCORE_650_699" | "SCORE_700_749" | "SCORE_750_PLUS" | "UNKNOWN";
  loanPurpose: string;
  score: number;
  scoreReason: string;
  status: LeadStatus;
  source: string;
  city: string;
  state: string;
  createdAt: string; // ISO
  updatedAt: string;
};

export const KPI = {
  totalLeads: 127,
  qualifiedLeads: 43,
  conversionPct: 34,
  pipelineUsd: 284_000,
} as const;

// 30-day leads timeseries (today-29 → today). Believable weekday dip.
export const leadsOver30Days: { date: string; leads: number; qualified: number }[] =
  (() => {
    const out: { date: string; leads: number; qualified: number }[] = [];
    const today = new Date("2026-04-21");
    const base = [3, 5, 4, 6, 4, 2, 1]; // Mon..Sun weekly shape
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dow = (d.getDay() + 6) % 7; // 0 = Mon
      const growth = 1 + (29 - i) * 0.03;
      const noise = ((i * 13) % 5) - 2;
      const leads = Math.max(1, Math.round((base[dow] ?? 3) * growth + noise));
      const qualified = Math.max(0, Math.round(leads * (0.25 + ((i * 7) % 20) / 100)));
      out.push({
        date: d.toISOString().slice(0, 10),
        leads,
        qualified,
      });
    }
    return out;
  })();

// 30 hand-crafted leads that feel like a real brokerage pipeline.
// Dates reverse-engineered from today (2026-04-21).
export const leads: DemoLead[] = [
  {
    id: "L-1021",
    businessName: "Desert Sun Landscaping",
    ownerName: "Marcus Whitaker",
    email: "marcus@desertsunland.com",
    phone: "(602) 555-0134",
    industry: "Landscaping",
    product: "SBA",
    loanAmount: 120_000,
    monthlyRevenue: 48_000,
    timeInBusinessMonths: 84,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Fleet expansion — 3 new crew trucks",
    score: 94,
    scoreReason:
      "Strong revenue-to-request ratio (2.5×), 7 yrs in business, 700+ credit, SBA-friendly industry.",
    status: "IN_APPLICATION",
    source: "Website form",
    city: "Phoenix",
    state: "AZ",
    createdAt: "2026-04-19T14:32:00Z",
    updatedAt: "2026-04-21T09:05:00Z",
  },
  {
    id: "L-1020",
    businessName: "Harbor Point Cafe",
    ownerName: "Elena Ruiz",
    email: "elena@harborpointcafe.com",
    phone: "(415) 555-0199",
    industry: "Food & beverage",
    product: "WORKING_CAPITAL",
    loanAmount: 45_000,
    monthlyRevenue: 32_000,
    timeInBusinessMonths: 36,
    creditScoreRange: "SCORE_650_699",
    loanPurpose: "Kitchen equipment + seasonal payroll",
    score: 87,
    scoreReason: "Healthy revenue, 3 yrs operating, moderate credit. Strong working-capital fit.",
    status: "QUALIFIED",
    source: "Referral (lender partner)",
    city: "San Francisco",
    state: "CA",
    createdAt: "2026-04-19T16:10:00Z",
    updatedAt: "2026-04-20T11:22:00Z",
  },
  {
    id: "L-1019",
    businessName: "Pillar Logistics LLC",
    ownerName: "Deion Harris",
    email: "deion@pillarlog.co",
    phone: "(312) 555-0147",
    industry: "Transportation & logistics",
    product: "EQUIPMENT",
    loanAmount: 280_000,
    monthlyRevenue: 185_000,
    timeInBusinessMonths: 60,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Two Class-8 trucks + trailers",
    score: 81,
    scoreReason: "Large ticket but solid monthly revenue covers debt service; equipment is collateral.",
    status: "QUALIFIED",
    source: "Website form",
    city: "Chicago",
    state: "IL",
    createdAt: "2026-04-18T10:44:00Z",
    updatedAt: "2026-04-20T14:10:00Z",
  },
  {
    id: "L-1018",
    businessName: "Vera Dental Group",
    ownerName: "Dr. Amelia Vera",
    email: "amelia@veradental.com",
    phone: "(713) 555-0188",
    industry: "Healthcare",
    product: "SBA",
    loanAmount: 65_000,
    monthlyRevenue: 72_000,
    timeInBusinessMonths: 48,
    creditScoreRange: "SCORE_750_PLUS",
    loanPurpose: "CBCT scanner + office refresh",
    score: 72,
    scoreReason: "Great credit and industry, but partial docs submitted. Needs bank statements.",
    status: "CONTACTED",
    source: "Google Ads",
    city: "Houston",
    state: "TX",
    createdAt: "2026-04-17T09:05:00Z",
    updatedAt: "2026-04-19T18:40:00Z",
  },
  {
    id: "L-1017",
    businessName: "Brickhouse Crossfit",
    ownerName: "Jordan Park",
    email: "jordan@brickhousecf.com",
    phone: "(206) 555-0122",
    industry: "Fitness",
    product: "MCA",
    loanAmount: 30_000,
    monthlyRevenue: 28_000,
    timeInBusinessMonths: 18,
    creditScoreRange: "SCORE_600_649",
    loanPurpose: "Equipment + membership marketing push",
    score: 68,
    scoreReason: "Below 2 yrs in business, thin credit — MCA is the right product, not SBA.",
    status: "CONTACTED",
    source: "Referral",
    city: "Seattle",
    state: "WA",
    createdAt: "2026-04-16T13:21:00Z",
    updatedAt: "2026-04-19T10:05:00Z",
  },
  {
    id: "L-1016",
    businessName: "Northstar Electric",
    ownerName: "Ryan O'Connell",
    email: "ryan@northstarelec.com",
    phone: "(612) 555-0173",
    industry: "Trades & construction",
    product: "LINE_OF_CREDIT",
    loanAmount: 150_000,
    monthlyRevenue: 95_000,
    timeInBusinessMonths: 72,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Working capital line for commercial jobs",
    score: 89,
    scoreReason: "6 yrs, strong revenue, requests within comfortable debt service ratio.",
    status: "QUALIFIED",
    source: "Referral",
    city: "Minneapolis",
    state: "MN",
    createdAt: "2026-04-15T08:14:00Z",
    updatedAt: "2026-04-20T17:30:00Z",
  },
  {
    id: "L-1015",
    businessName: "Bayou Bean Roasters",
    ownerName: "Camille Boudreaux",
    email: "camille@bayoubean.com",
    phone: "(504) 555-0112",
    industry: "Food & beverage",
    product: "WORKING_CAPITAL",
    loanAmount: 55_000,
    monthlyRevenue: 41_000,
    timeInBusinessMonths: 42,
    creditScoreRange: "SCORE_650_699",
    loanPurpose: "Second location build-out",
    score: 78,
    scoreReason: "Proven concept, growth play, reasonable request. Needs 3 months bank statements.",
    status: "CONTACTED",
    source: "Website form",
    city: "New Orleans",
    state: "LA",
    createdAt: "2026-04-14T15:40:00Z",
    updatedAt: "2026-04-18T14:02:00Z",
  },
  {
    id: "L-1014",
    businessName: "Summit Auto Body",
    ownerName: "Tariq Khan",
    email: "tariq@summitautobody.com",
    phone: "(303) 555-0145",
    industry: "Automotive",
    product: "EQUIPMENT",
    loanAmount: 85_000,
    monthlyRevenue: 62_000,
    timeInBusinessMonths: 96,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Paint booth + frame machine",
    score: 85,
    scoreReason: "8 yrs operating, great revenue, equipment financing is naturally collateralized.",
    status: "IN_APPLICATION",
    source: "Website form",
    city: "Denver",
    state: "CO",
    createdAt: "2026-04-13T11:02:00Z",
    updatedAt: "2026-04-20T09:48:00Z",
  },
  {
    id: "L-1013",
    businessName: "Kingsley Boutique",
    ownerName: "Monique Kingsley",
    email: "monique@kingsleyboutique.com",
    phone: "(404) 555-0176",
    industry: "Retail",
    product: "MCA",
    loanAmount: 25_000,
    monthlyRevenue: 18_000,
    timeInBusinessMonths: 24,
    creditScoreRange: "SCORE_600_649",
    loanPurpose: "Inventory for summer season",
    score: 62,
    scoreReason: "Tight ratios, short tenure, but MCA acceptable with daily remit.",
    status: "CONTACTED",
    source: "Google Ads",
    city: "Atlanta",
    state: "GA",
    createdAt: "2026-04-12T09:33:00Z",
    updatedAt: "2026-04-17T15:20:00Z",
  },
  {
    id: "L-1012",
    businessName: "Ironclad Welding",
    ownerName: "Aaron Briggs",
    email: "aaron@ironcladweld.com",
    phone: "(214) 555-0191",
    industry: "Manufacturing",
    product: "SBA",
    loanAmount: 220_000,
    monthlyRevenue: 140_000,
    timeInBusinessMonths: 108,
    creditScoreRange: "SCORE_750_PLUS",
    loanPurpose: "Shop expansion + CNC plasma table",
    score: 96,
    scoreReason: "9 yrs, 750+ credit, strong revenue, ideal SBA profile.",
    status: "CLOSED",
    source: "Referral",
    city: "Dallas",
    state: "TX",
    createdAt: "2026-03-28T10:15:00Z",
    updatedAt: "2026-04-11T16:00:00Z",
  },
  {
    id: "L-1011",
    businessName: "Coastal HVAC Services",
    ownerName: "Priya Ramanathan",
    email: "priya@coastalhvac.com",
    phone: "(619) 555-0118",
    industry: "Trades & construction",
    product: "LINE_OF_CREDIT",
    loanAmount: 75_000,
    monthlyRevenue: 58_000,
    timeInBusinessMonths: 54,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Seasonal hiring + van fleet maintenance",
    score: 82,
    scoreReason: "Solid ratios, steady growth. Line of credit suits seasonality.",
    status: "QUALIFIED",
    source: "Website form",
    city: "San Diego",
    state: "CA",
    createdAt: "2026-04-11T14:55:00Z",
    updatedAt: "2026-04-18T12:00:00Z",
  },
  {
    id: "L-1010",
    businessName: "Meridian Accounting",
    ownerName: "Helena Kovac",
    email: "helena@meridianacct.com",
    phone: "(857) 555-0150",
    industry: "Professional services",
    product: "WORKING_CAPITAL",
    loanAmount: 40_000,
    monthlyRevenue: 35_000,
    timeInBusinessMonths: 60,
    creditScoreRange: "SCORE_750_PLUS",
    loanPurpose: "Staff hire + tax-season bridge",
    score: 88,
    scoreReason: "Pristine credit, recurring revenue, tax-season cash flow play.",
    status: "CLOSED",
    source: "Referral",
    city: "Boston",
    state: "MA",
    createdAt: "2026-04-02T09:10:00Z",
    updatedAt: "2026-04-14T17:45:00Z",
  },
  {
    id: "L-1009",
    businessName: "Route 66 Motors",
    ownerName: "Chuck Delaney",
    email: "chuck@route66motors.com",
    phone: "(405) 555-0131",
    industry: "Automotive",
    product: "MCA",
    loanAmount: 60_000,
    monthlyRevenue: 28_000,
    timeInBusinessMonths: 22,
    creditScoreRange: "UNDER_600",
    loanPurpose: "Used car inventory",
    score: 48,
    scoreReason: "Sub-600 credit, < 2 yrs, inventory-heavy. Higher-cost MCA only.",
    status: "LOST",
    source: "Google Ads",
    city: "Oklahoma City",
    state: "OK",
    createdAt: "2026-04-05T12:00:00Z",
    updatedAt: "2026-04-12T09:30:00Z",
  },
  {
    id: "L-1008",
    businessName: "Evergreen Pediatrics",
    ownerName: "Dr. Lena Yamamoto",
    email: "lena@evergreenpeds.com",
    phone: "(503) 555-0166",
    industry: "Healthcare",
    product: "SBA",
    loanAmount: 180_000,
    monthlyRevenue: 120_000,
    timeInBusinessMonths: 84,
    creditScoreRange: "SCORE_750_PLUS",
    loanPurpose: "Second clinic location",
    score: 93,
    scoreReason: "Healthcare, 7 yrs, 750+ credit, expansion with proven P&L — textbook SBA.",
    status: "CLOSED",
    source: "Referral",
    city: "Portland",
    state: "OR",
    createdAt: "2026-03-20T11:30:00Z",
    updatedAt: "2026-04-08T15:00:00Z",
  },
  {
    id: "L-1007",
    businessName: "Cobalt Digital Agency",
    ownerName: "Evan Montague",
    email: "evan@cobaltdigital.co",
    phone: "(646) 555-0129",
    industry: "Professional services",
    product: "WORKING_CAPITAL",
    loanAmount: 50_000,
    monthlyRevenue: 42_000,
    timeInBusinessMonths: 30,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Payroll bridge + tooling",
    score: 76,
    scoreReason: "Agency with stable MRR; 2.5 yrs tenure — just qualifies.",
    status: "IN_APPLICATION",
    source: "Website form",
    city: "New York",
    state: "NY",
    createdAt: "2026-04-10T14:18:00Z",
    updatedAt: "2026-04-19T13:05:00Z",
  },
  {
    id: "L-1006",
    businessName: "Redwood Timber Co.",
    ownerName: "Nate Holloway",
    email: "nate@redwoodtimber.com",
    phone: "(707) 555-0158",
    industry: "Manufacturing",
    product: "EQUIPMENT",
    loanAmount: 340_000,
    monthlyRevenue: 210_000,
    timeInBusinessMonths: 144,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Sawmill upgrade",
    score: 91,
    scoreReason: "12 yrs, large revenue, collateralizable equipment purchase.",
    status: "IN_APPLICATION",
    source: "Referral",
    city: "Eureka",
    state: "CA",
    createdAt: "2026-04-08T09:40:00Z",
    updatedAt: "2026-04-20T10:12:00Z",
  },
  {
    id: "L-1005",
    businessName: "Silver Spoon Catering",
    ownerName: "Renata Oliveira",
    email: "renata@silverspooncater.com",
    phone: "(305) 555-0142",
    industry: "Food & beverage",
    product: "WORKING_CAPITAL",
    loanAmount: 35_000,
    monthlyRevenue: 26_000,
    timeInBusinessMonths: 40,
    creditScoreRange: "SCORE_650_699",
    loanPurpose: "Equipment + staffing for wedding season",
    score: 74,
    scoreReason: "Seasonal cash flow, solid fit for working capital.",
    status: "QUALIFIED",
    source: "Website form",
    city: "Miami",
    state: "FL",
    createdAt: "2026-04-09T16:20:00Z",
    updatedAt: "2026-04-17T10:05:00Z",
  },
  {
    id: "L-1004",
    businessName: "Ridge & Row Farms",
    ownerName: "Samuel Carter",
    email: "sam@ridgerowfarms.com",
    phone: "(859) 555-0137",
    industry: "Agriculture",
    product: "EQUIPMENT",
    loanAmount: 95_000,
    monthlyRevenue: 54_000,
    timeInBusinessMonths: 72,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Tractor + irrigation",
    score: 83,
    scoreReason: "6 yrs, equipment-backed, decent cash flow.",
    status: "QUALIFIED",
    source: "Google Ads",
    city: "Lexington",
    state: "KY",
    createdAt: "2026-04-07T10:45:00Z",
    updatedAt: "2026-04-16T16:18:00Z",
  },
  {
    id: "L-1003",
    businessName: "Polaris Pet Clinic",
    ownerName: "Dr. Farouk Mensah",
    email: "farouk@polarispet.com",
    phone: "(907) 555-0110",
    industry: "Healthcare",
    product: "SBA",
    loanAmount: 160_000,
    monthlyRevenue: 88_000,
    timeInBusinessMonths: 66,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "New ultrasound + surgery suite",
    score: 86,
    scoreReason: "Vet practices are strong SBA targets; numbers check out.",
    status: "CLOSED",
    source: "Referral",
    city: "Anchorage",
    state: "AK",
    createdAt: "2026-03-25T13:05:00Z",
    updatedAt: "2026-04-10T14:00:00Z",
  },
  {
    id: "L-1002",
    businessName: "Freedom Fitness Co-op",
    ownerName: "Cameron Brooks",
    email: "cameron@freedomfit.coop",
    phone: "(615) 555-0165",
    industry: "Fitness",
    product: "MCA",
    loanAmount: 20_000,
    monthlyRevenue: 15_000,
    timeInBusinessMonths: 14,
    creditScoreRange: "SCORE_600_649",
    loanPurpose: "Spring marketing + new mats",
    score: 54,
    scoreReason: "Under 2 yrs, thin margins. Higher-cost product only.",
    status: "CONTACTED",
    source: "Website form",
    city: "Nashville",
    state: "TN",
    createdAt: "2026-04-10T19:00:00Z",
    updatedAt: "2026-04-14T09:10:00Z",
  },
  {
    id: "L-1001",
    businessName: "Anvil Coffee Supply",
    ownerName: "Ingrid Sørensen",
    email: "ingrid@anvilcoffee.com",
    phone: "(206) 555-0101",
    industry: "Wholesale",
    product: "WORKING_CAPITAL",
    loanAmount: 70_000,
    monthlyRevenue: 68_000,
    timeInBusinessMonths: 78,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Green-bean inventory for Q3",
    score: 84,
    scoreReason: "Steady B2B revenue, established business, reasonable request.",
    status: "IN_APPLICATION",
    source: "Referral",
    city: "Seattle",
    state: "WA",
    createdAt: "2026-04-06T08:50:00Z",
    updatedAt: "2026-04-19T11:22:00Z",
  },
  {
    id: "L-1000",
    businessName: "Stonewall Brewing Co.",
    ownerName: "Mason Whitfield",
    email: "mason@stonewallbrew.com",
    phone: "(804) 555-0154",
    industry: "Food & beverage",
    product: "EQUIPMENT",
    loanAmount: 125_000,
    monthlyRevenue: 82_000,
    timeInBusinessMonths: 90,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "New 30bbl fermenters",
    score: 88,
    scoreReason: "7+ yrs, equipment-backed, strong craft-beer margins.",
    status: "CLOSED",
    source: "Referral",
    city: "Richmond",
    state: "VA",
    createdAt: "2026-03-15T11:12:00Z",
    updatedAt: "2026-04-05T09:20:00Z",
  },
  {
    id: "L-0999",
    businessName: "Copper Peak Roofing",
    ownerName: "Willa Benton",
    email: "willa@copperpeakroof.com",
    phone: "(801) 555-0125",
    industry: "Trades & construction",
    product: "SBA",
    loanAmount: 145_000,
    monthlyRevenue: 90_000,
    timeInBusinessMonths: 66,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Fleet + storage yard",
    score: 85,
    scoreReason: "Solid trades business with room for SBA.",
    status: "NEW",
    source: "Website form",
    city: "Salt Lake City",
    state: "UT",
    createdAt: "2026-04-20T09:18:00Z",
    updatedAt: "2026-04-20T09:18:00Z",
  },
  {
    id: "L-0998",
    businessName: "Luna Tile & Stone",
    ownerName: "Ana Castillo",
    email: "ana@lunatile.com",
    phone: "(520) 555-0139",
    industry: "Trades & construction",
    product: "WORKING_CAPITAL",
    loanAmount: 55_000,
    monthlyRevenue: 38_000,
    timeInBusinessMonths: 28,
    creditScoreRange: "SCORE_650_699",
    loanPurpose: "Payroll bridge on a large commercial contract",
    score: 71,
    scoreReason: "Just past 2 yrs, reasonable credit, clear use of funds.",
    status: "NEW",
    source: "Website form",
    city: "Tucson",
    state: "AZ",
    createdAt: "2026-04-21T07:45:00Z",
    updatedAt: "2026-04-21T07:45:00Z",
  },
  {
    id: "L-0997",
    businessName: "Westfield Auto Glass",
    ownerName: "Raj Patel",
    email: "raj@westfieldglass.com",
    phone: "(973) 555-0167",
    industry: "Automotive",
    product: "EQUIPMENT",
    loanAmount: 40_000,
    monthlyRevenue: 31_000,
    timeInBusinessMonths: 34,
    creditScoreRange: "SCORE_650_699",
    loanPurpose: "Mobile service van + tooling",
    score: 73,
    scoreReason: "Steady small-ticket equipment deal. Clear collateral.",
    status: "CONTACTED",
    source: "Google Ads",
    city: "Newark",
    state: "NJ",
    createdAt: "2026-04-11T11:40:00Z",
    updatedAt: "2026-04-16T13:22:00Z",
  },
  {
    id: "L-0996",
    businessName: "Oak Hollow Veterinary",
    ownerName: "Dr. Nico Alvarez",
    email: "nico@oakhollowvet.com",
    phone: "(615) 555-0120",
    industry: "Healthcare",
    product: "SBA",
    loanAmount: 210_000,
    monthlyRevenue: 130_000,
    timeInBusinessMonths: 96,
    creditScoreRange: "SCORE_750_PLUS",
    loanPurpose: "Practice acquisition",
    score: 95,
    scoreReason: "Ideal SBA profile: healthcare acquisition, strong operator.",
    status: "IN_APPLICATION",
    source: "Referral",
    city: "Nashville",
    state: "TN",
    createdAt: "2026-04-04T10:22:00Z",
    updatedAt: "2026-04-20T15:48:00Z",
  },
  {
    id: "L-0995",
    businessName: "Blue Ridge Movers",
    ownerName: "Tyler Gainey",
    email: "tyler@blueridgemove.com",
    phone: "(828) 555-0116",
    industry: "Transportation & logistics",
    product: "EQUIPMENT",
    loanAmount: 90_000,
    monthlyRevenue: 55_000,
    timeInBusinessMonths: 60,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Two box trucks",
    score: 80,
    scoreReason: "Seasoned operator, collateralized equipment, comfortable DSCR.",
    status: "QUALIFIED",
    source: "Website form",
    city: "Asheville",
    state: "NC",
    createdAt: "2026-04-09T12:32:00Z",
    updatedAt: "2026-04-18T11:05:00Z",
  },
  {
    id: "L-0994",
    businessName: "Cedar Bluff Dairy",
    ownerName: "Hazel Thorpe",
    email: "hazel@cedarbluffdairy.com",
    phone: "(608) 555-0148",
    industry: "Agriculture",
    product: "WORKING_CAPITAL",
    loanAmount: 60_000,
    monthlyRevenue: 44_000,
    timeInBusinessMonths: 108,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Herd expansion + feed",
    score: 79,
    scoreReason: "Long-tenured family operation; seasonality in favor of line of credit.",
    status: "CONTACTED",
    source: "Referral",
    city: "Madison",
    state: "WI",
    createdAt: "2026-04-08T14:15:00Z",
    updatedAt: "2026-04-15T16:40:00Z",
  },
  {
    id: "L-0993",
    businessName: "Riverbend Bookkeeping",
    ownerName: "Greta Ahmadi",
    email: "greta@riverbendbooks.com",
    phone: "(515) 555-0195",
    industry: "Professional services",
    product: "WORKING_CAPITAL",
    loanAmount: 18_000,
    monthlyRevenue: 14_000,
    timeInBusinessMonths: 20,
    creditScoreRange: "SCORE_650_699",
    loanPurpose: "Software + hiring second bookkeeper",
    score: 58,
    scoreReason: "Small business, marginal time-in-business, modest request.",
    status: "LOST",
    source: "Website form",
    city: "Des Moines",
    state: "IA",
    createdAt: "2026-03-30T09:50:00Z",
    updatedAt: "2026-04-10T14:55:00Z",
  },
  {
    id: "L-0992",
    businessName: "Lockhart BBQ Supply",
    ownerName: "Emmett Ross",
    email: "emmett@lockhartbbq.com",
    phone: "(512) 555-0181",
    industry: "Wholesale",
    product: "LINE_OF_CREDIT",
    loanAmount: 100_000,
    monthlyRevenue: 74_000,
    timeInBusinessMonths: 84,
    creditScoreRange: "SCORE_700_749",
    loanPurpose: "Seasonal inventory (smokers + rubs)",
    score: 86,
    scoreReason: "Predictable seasonal cash flow, established operator.",
    status: "QUALIFIED",
    source: "Referral",
    city: "Austin",
    state: "TX",
    createdAt: "2026-04-07T11:00:00Z",
    updatedAt: "2026-04-19T10:30:00Z",
  },
];

export function getLeadById(id: string): DemoLead | undefined {
  return leads.find((l) => l.id === id);
}

export type DemoInteraction = {
  id: string;
  leadId: string;
  type: "EMAIL" | "SMS" | "CALL" | "NOTE" | "STATUS_CHANGE" | "AI_ACTION";
  direction: "INBOUND" | "OUTBOUND" | "INTERNAL";
  subject?: string;
  content: string;
  actor: string;
  createdAt: string;
};

export function getInteractions(leadId: string): DemoInteraction[] {
  // Deterministic per-lead timeline — enough variety for the tab to feel lived-in.
  const lead = getLeadById(leadId);
  if (!lead) return [];
  const base = new Date(lead.createdAt).getTime();
  const mins = (n: number) => new Date(base + n * 60_000).toISOString();

  return [
    {
      id: `${leadId}-i1`,
      leadId,
      type: "AI_ACTION",
      direction: "INTERNAL",
      subject: "Lead scored",
      content: `AI scored this lead ${lead.score}/100. ${lead.scoreReason}`,
      actor: "BrokerOS AI",
      createdAt: mins(2),
    },
    {
      id: `${leadId}-i2`,
      leadId,
      type: "EMAIL",
      direction: "OUTBOUND",
      subject: "Welcome — next steps for your loan",
      content:
        "Sent branded welcome email with document request link (bank statements, last 2 yrs tax returns, voided check).",
      actor: "Automation",
      createdAt: mins(3),
    },
    {
      id: `${leadId}-i3`,
      leadId,
      type: "NOTE",
      direction: "INTERNAL",
      content: `Called ${lead.ownerName} — left voicemail. Following up tomorrow morning.`,
      actor: "Umer",
      createdAt: mins(60 * 24),
    },
    {
      id: `${leadId}-i4`,
      leadId,
      type: "EMAIL",
      direction: "INBOUND",
      subject: "Re: Welcome — next steps for your loan",
      content:
        "Thanks — uploading bank statements tonight. Quick question on rate range for our situation.",
      actor: lead.ownerName,
      createdAt: mins(60 * 26),
    },
    {
      id: `${leadId}-i5`,
      leadId,
      type: "STATUS_CHANGE",
      direction: "INTERNAL",
      content: `Status updated to ${lead.status}.`,
      actor: "Umer",
      createdAt: lead.updatedAt,
    },
  ];
}

export type DemoDocument = {
  id: string;
  leadId: string;
  type:
    | "BANK_STATEMENT"
    | "TAX_RETURN"
    | "DRIVERS_LICENSE"
    | "VOIDED_CHECK"
    | "PROFIT_LOSS"
    | "BALANCE_SHEET"
    | "OTHER";
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
};

export function getDocuments(leadId: string): DemoDocument[] {
  const lead = getLeadById(leadId);
  if (!lead) return [];
  if (lead.status === "NEW" || lead.status === "CONTACTED") {
    return [];
  }
  const base = new Date(lead.updatedAt).getTime();
  return [
    {
      id: `${leadId}-d1`,
      leadId,
      type: "BANK_STATEMENT",
      filename: "bank-statement-feb-2026.pdf",
      sizeBytes: 412_300,
      uploadedAt: new Date(base - 86_400_000 * 3).toISOString(),
    },
    {
      id: `${leadId}-d2`,
      leadId,
      type: "BANK_STATEMENT",
      filename: "bank-statement-jan-2026.pdf",
      sizeBytes: 398_110,
      uploadedAt: new Date(base - 86_400_000 * 3).toISOString(),
    },
    {
      id: `${leadId}-d3`,
      leadId,
      type: "TAX_RETURN",
      filename: "form-1120s-2024.pdf",
      sizeBytes: 2_104_860,
      uploadedAt: new Date(base - 86_400_000 * 2).toISOString(),
    },
    {
      id: `${leadId}-d4`,
      leadId,
      type: "VOIDED_CHECK",
      filename: "voided-check-operating.jpg",
      sizeBytes: 184_200,
      uploadedAt: new Date(base - 86_400_000 * 1).toISOString(),
    },
  ];
}

export const STATUS_META: Record<
  LeadStatus,
  { label: string; tone: "slate" | "amber" | "success" | "info" | "primary" | "danger" }
> = {
  NEW: { label: "New", tone: "info" },
  CONTACTED: { label: "Contacted", tone: "slate" },
  QUALIFIED: { label: "Qualified", tone: "amber" },
  IN_APPLICATION: { label: "In application", tone: "primary" },
  CLOSED: { label: "Closed", tone: "success" },
  LOST: { label: "Lost", tone: "danger" },
};

export const PRODUCT_LABEL: Record<LoanProduct, string> = {
  SBA: "SBA",
  MCA: "MCA",
  EQUIPMENT: "Equipment",
  WORKING_CAPITAL: "Working capital",
  LINE_OF_CREDIT: "Line of credit",
  OTHER: "Other",
};

export function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `$${n}`;
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}
