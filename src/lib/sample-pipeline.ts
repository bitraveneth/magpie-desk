import { company } from "@/content/company";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const marker = "Sample dossier.";

type Line = { description: string; quantity: number; unitAmount: number; discountRate?: number };
type ProjectType = "Website" | "Ecommerce website" | "Mobile app" | "ERP";
type PartnerCode = "sample-partner" | "south-china-leads" | "studio-referrals";

type Dossier = {
  number: string;
  token: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  title: string;
  blurb: string;
  projectType: ProjectType;
  phone: string;
  industry: string;
  city: string;
  description: string;
  partner: PartnerCode | null;
  currency: "CNY" | "USD";
  purpose: "WEB" | "PRODUCT" | "TRADING";
  invoiceStatus: "DRAFT" | "ISSUED" | "PAID";
  paymentMethod: "COMPANY_QR" | "BANK_SLIP" | null;
  quoteNumber: string;
  contractNumber: string;
  invoiceNumber: string;
  ndaNumber: string;
  when: string;
  lines: Line[];
  kind: string;
  change: string;
  audience: string;
  competitors: string;
  success: string;
  languages: string[];
  stack: string[];
  connections: string[];
  hosting: string;
  traffic: string;
  budget: string;
  launch: string;
  note: string;
  liked: string;
  likedNote: string;
  style: string;
  specific: { questionId: string; value: string }[];
};

const dossiers: Dossier[] = [
  {
    number: "REQ-SAMPLE-FILLED",
    token: "smplfilled001",
    clientName: "Mei Lin",
    clientEmail: "mei@harbor.example",
    clientCompany: "Harbor Cafe",
    title: "Harbor Cafe website",
    blurb: "A menu and booking site for two cafes in Shekou.",
    projectType: "Website",
    phone: "13800001101",
    industry: "Food",
    city: "Shenzhen, China",
    description: "Two cafes need one site with the menu, photos, and a table booking form.",
    partner: "sample-partner",
    currency: "CNY",
    purpose: "WEB",
    invoiceStatus: "DRAFT",
    paymentMethod: null,
    quoteNumber: "QUO-SAMPLE-HARBOR",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-HB",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-HINV",
    ndaNumber: "NDA-SAMPLE-HARBOR",
    when: "2026-10-03T02:00:00.000Z",
    lines: [
      { description: "Cafe website, six pages", quantity: 1, unitAmount: 12800, discountRate: 10 },
      { description: "Table booking form", quantity: 1, unitAmount: 3600 },
      { description: "Menu layout", quantity: 1, unitAmount: 1800 },
    ],
    kind: "New build",
    change: "More sales",
    audience: "People nearby who want coffee, brunch, and a table on weekends.",
    competitors: "Seesaw and % Arabica neighborhood pages.",
    success: "Online booking covers half of weekend tables.",
    languages: ["Chinese", "English"],
    stack: ["Next.js", "TypeScript"],
    connections: ["WeChat or Alipay", "Email"],
    hosting: "Neither",
    traffic: "Under 1,000",
    budget: "5,000–15,000",
    launch: "2026-12-01",
    note: "Both shops share one kitchen brand.",
    liked: "https://example.com/harbor-like",
    likedNote: "Warm photos and a short menu.",
    style: "Cream paper, dark green type, no neon.",
    specific: [
      { questionId: "site-content", value: "Home, menu, two shop pages, booking, and contact." },
      { questionId: "site-pages", value: JSON.stringify(["Home", "About", "Contact", "Other"]) },
      { questionId: "site-copy", value: "We have some" },
      { questionId: "site-updates", value: "Often by us" },
    ],
  },
  {
    number: "REQ-SAMPLE-SIGNED",
    token: "smplsigned001",
    clientName: "Dr. Chen",
    clientEmail: "chen@northline.example",
    clientCompany: "Northline Clinic",
    title: "Northline booking app",
    blurb: "Appointment booking for patients and the front desk.",
    projectType: "Mobile app",
    phone: "13800001102",
    industry: "Health",
    city: "Guangzhou, China",
    description: "Patients book visits. Staff see the day and can move an appointment.",
    partner: "studio-referrals",
    currency: "CNY",
    purpose: "WEB",
    invoiceStatus: "DRAFT",
    paymentMethod: null,
    quoteNumber: "QUO-SAMPLE-NORTH",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-NL",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-NINV",
    ndaNumber: "NDA-SAMPLE-NORTH",
    when: "2026-10-06T02:00:00.000Z",
    lines: [
      { description: "Patient booking app", quantity: 1, unitAmount: 28000, discountRate: 5 },
      { description: "Staff day schedule", quantity: 1, unitAmount: 8000 },
    ],
    kind: "New build",
    change: "Run daily work",
    audience: "Patients and three reception staff.",
    competitors: "The clinic's current paper book.",
    success: "The paper book is retired.",
    languages: ["Chinese"],
    stack: ["React Native", "TypeScript"],
    connections: ["Email", "WhatsApp"],
    hosting: "We have both",
    traffic: "1,000–10,000",
    budget: "15,000–50,000",
    launch: "2027-01-15",
    note: "No medical records in the first version.",
    liked: "https://example.com/clinic-like",
    likedNote: "Large type and few steps.",
    style: "White and soft blue. No stock smiles.",
    specific: [
      { questionId: "app-phones", value: "Both" },
      { questionId: "app-accounts", value: "Yes" },
      { questionId: "app-jobs", value: "Book, cancel, and see today's list." },
      { questionId: "app-offline", value: "No" },
      { questionId: "app-stores", value: "We need help" },
      { questionId: "app-url", value: "" },
    ],
  },
  {
    number: "REQ-SAMPLE-QUOTE",
    token: "smplquote0001",
    clientName: "Alex Cho",
    clientEmail: "alex@lumen.example",
    clientCompany: "Lumen Retail",
    title: "Lumen shop website",
    blurb: "A shop site with product pages and card checkout.",
    projectType: "Ecommerce website",
    phone: "13800001103",
    industry: "Retail",
    city: "Hong Kong",
    description: "About forty home products, with sizes, photos, and card payment.",
    partner: "sample-partner",
    currency: "USD",
    purpose: "WEB",
    invoiceStatus: "ISSUED",
    paymentMethod: "COMPANY_QR",
    quoteNumber: "QUO-SAMPLE-LUMEN",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-LM",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-LINV",
    ndaNumber: "NDA-SAMPLE-LUMEN",
    when: "2026-10-08T02:00:00.000Z",
    lines: [
      { description: "Shop website", quantity: 1, unitAmount: 3000 },
      { description: "Product page setup", quantity: 40, unitAmount: 25, discountRate: 10 },
    ],
    kind: "New build",
    change: "More sales",
    audience: "Home buyers in Hong Kong.",
    competitors: "Two local Instagram shops.",
    success: "The first month takes orders without a spreadsheet.",
    languages: ["English", "Chinese"],
    stack: ["Next.js", "TypeScript"],
    connections: ["Card payments", "Email"],
    hosting: "Domain only",
    traffic: "1,000–10,000",
    budget: "3,000–5,000",
    launch: "2026-11-20",
    note: "Products arrive as a spreadsheet.",
    liked: "https://example.com/lumen-like",
    likedNote: "Quiet product photos.",
    style: "Black type, white space, one brass accent.",
    specific: [
      { questionId: "shop-sell", value: "Lamps, chairs, and small home goods." },
      { questionId: "shop-payments", value: JSON.stringify(["Card"]) },
      { questionId: "shop-delivery", value: "Shipping" },
      { questionId: "shop-catalog", value: "20–200" },
      { questionId: "shop-copy", value: "We have some" },
    ],
  },
  {
    number: "REQ-SAMPLE-CONTRACT",
    token: "smplcontract1",
    clientName: "Priya Shah",
    clientEmail: "priya@fieldwork.example",
    clientCompany: "Fieldwork Goods",
    title: "Fieldwork inventory",
    blurb: "Inventory and purchasing for three warehouses.",
    projectType: "ERP",
    phone: "13800001104",
    industry: "Logistics",
    city: "Shanghai, China",
    description: "Stock, purchase orders, and a simple count at three warehouses.",
    partner: null,
    currency: "USD",
    purpose: "WEB",
    invoiceStatus: "ISSUED",
    paymentMethod: "BANK_SLIP",
    quoteNumber: "QUO-SAMPLE-FIELD",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-CT",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-CINV",
    ndaNumber: "NDA-SAMPLE-FIELD",
    when: "2026-10-12T02:00:00.000Z",
    lines: [
      { description: "Inventory module", quantity: 1, unitAmount: 8000 },
      { description: "Warehouse setup", quantity: 3, unitAmount: 600 },
    ],
    kind: "New build",
    change: "Replace an old system",
    audience: "Warehouse leads and the buyer.",
    competitors: "A shared spreadsheet.",
    success: "Each warehouse can count stock without calling the office.",
    languages: ["English", "Chinese"],
    stack: ["Next.js", "TypeScript", "Node.js"],
    connections: ["Email"],
    hosting: "We have both",
    traffic: "Under 1,000",
    budget: "5,000–15,000",
    launch: "2027-02-01",
    note: "Old rows should move across.",
    liked: "https://example.com/field-like",
    likedNote: "Dense tables that stay readable.",
    style: "Neutral gray, one blue for actions.",
    specific: [
      { questionId: "erp-modules", value: JSON.stringify(["Inventory", "Sales"]) },
      { questionId: "erp-users", value: "6–20" },
      { questionId: "erp-current", value: "Spreadsheets and WeChat photos of the shelf." },
      { questionId: "erp-broken", value: "Counts disagree by the end of the week." },
      { questionId: "erp-migrate", value: "Yes" },
      { questionId: "erp-integrations", value: "Email a purchase order. No other system yet." },
      { questionId: "erp-sites", value: "3 warehouses" },
    ],
  },
  {
    number: "REQ-SAMPLE-PAID",
    token: "smplpaid00001",
    clientName: "Owen Park",
    clientEmail: "owen@kite.example",
    clientCompany: "Kite Travel",
    title: "Kite Travel site",
    blurb: "A trip catalog with enquiry forms.",
    projectType: "Website",
    phone: "13800001105",
    industry: "Professional services",
    city: "Seoul, Korea",
    description: "A small catalog of trips and a form that asks for dates and the group size.",
    partner: "sample-partner",
    currency: "USD",
    purpose: "WEB",
    invoiceStatus: "PAID",
    paymentMethod: "COMPANY_QR",
    quoteNumber: "QUO-SAMPLE-KITE",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-PD",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-INV",
    ndaNumber: "NDA-SAMPLE-KITE",
    when: "2026-10-15T02:00:00.000Z",
    lines: [
      { description: "Starter website, three pages", quantity: 1, unitAmount: 1000 },
      { description: "Trip enquiry form", quantity: 1, unitAmount: 400, discountRate: 15 },
    ],
    kind: "New build",
    change: "More leads",
    audience: "Small groups planning a short trip.",
    competitors: "Two tour pages on Instagram.",
    success: "Enquiries arrive in one inbox.",
    languages: ["English", "Korean"],
    stack: ["Next.js", "TypeScript"],
    connections: ["Email", "WhatsApp"],
    hosting: "Domain only",
    traffic: "Under 1,000",
    budget: "1,000–3,000",
    launch: "2026-11-01",
    note: "Trips change every season.",
    liked: "https://example.com/kite-like",
    likedNote: "Large trip photos.",
    style: "Sky blue, lots of white.",
    specific: [
      { questionId: "site-content", value: "Home, trip list, and a contact form." },
      { questionId: "site-pages", value: JSON.stringify(["Home", "Services", "Contact"]) },
      { questionId: "site-copy", value: "We have all of it" },
      { questionId: "site-updates", value: "Often by us" },
    ],
  },
  {
    number: "REQ-SAMPLE-BAMBOO",
    token: "smplbamboo001",
    clientName: "Lin Zhou",
    clientEmail: "lin@bamboo.example",
    clientCompany: "Bamboo Tea",
    title: "Bamboo Tea shop",
    blurb: "An online shop for tea tins, with WeChat and Alipay.",
    projectType: "Ecommerce website",
    phone: "13800001106",
    industry: "Food",
    city: "Hangzhou, China",
    description: "Sell tea tins online. Customers pay with WeChat or Alipay and choose shipping or pickup.",
    partner: "south-china-leads",
    currency: "CNY",
    purpose: "WEB",
    invoiceStatus: "PAID",
    paymentMethod: "BANK_SLIP",
    quoteNumber: "QUO-SAMPLE-BAMBOO",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-BB",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-BINV",
    ndaNumber: "NDA-SAMPLE-BAMBOO",
    when: "2026-10-18T02:00:00.000Z",
    lines: [
      { description: "Tea shop website", quantity: 1, unitAmount: 15600, discountRate: 8 },
      { description: "WeChat and Alipay checkout", quantity: 1, unitAmount: 2400 },
    ],
    kind: "New build",
    change: "More sales",
    audience: "Gift buyers and regular tea drinkers.",
    competitors: "A Tmall store they want to leave.",
    success: "Repeat orders come through the site.",
    languages: ["Chinese"],
    stack: ["Next.js", "TypeScript"],
    connections: ["WeChat or Alipay"],
    hosting: "Neither",
    traffic: "1,000–10,000",
    budget: "15,000–50,000",
    launch: "2026-12-12",
    note: "About eighty tins at launch.",
    liked: "https://example.com/tea-like",
    likedNote: "Paper labels and a calm shop.",
    style: "Bamboo green and warm paper.",
    specific: [
      { questionId: "shop-sell", value: "Loose tea and gift tins." },
      { questionId: "shop-payments", value: JSON.stringify(["WeChat", "Alipay"]) },
      { questionId: "shop-delivery", value: "Both" },
      { questionId: "shop-catalog", value: "20–200" },
      { questionId: "shop-copy", value: "We have them" },
    ],
  },
  {
    number: "REQ-SAMPLE-ATLAS",
    token: "smplatlas0001",
    clientName: "Sam Iqbal",
    clientEmail: "sam@atlas.example",
    clientCompany: "Atlas Parts",
    title: "Atlas spare parts",
    blurb: "A parts catalog and a packing list for workshop orders.",
    projectType: "Website",
    phone: "13800001107",
    industry: "Manufacturing",
    city: "Dubai, UAE",
    description: "Workshops look up a part number and ask for a quote. Staff turn that into a packing list.",
    partner: "studio-referrals",
    currency: "CNY",
    purpose: "PRODUCT",
    invoiceStatus: "DRAFT",
    paymentMethod: null,
    quoteNumber: "QUO-SAMPLE-ATLAS",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-AT",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-AINV",
    ndaNumber: "NDA-SAMPLE-ATLAS",
    when: "2026-10-21T02:00:00.000Z",
    lines: [
      { description: "Parts catalog", quantity: 1, unitAmount: 42000, discountRate: 5 },
      { description: "Packing list", quantity: 1, unitAmount: 1800 },
    ],
    kind: "New build",
    change: "More leads",
    audience: "Workshop buyers who already know the part number.",
    competitors: "A PDF catalog from last year.",
    success: "Quotes go out the same day.",
    languages: ["English", "Arabic"],
    stack: ["Next.js", "TypeScript"],
    connections: ["Email"],
    hosting: "We have both",
    traffic: "1,000–10,000",
    budget: "15,000–50,000",
    launch: "2027-03-01",
    note: "Prices stay hidden until a quote.",
    liked: "https://example.com/parts-like",
    likedNote: "Search first, photos second.",
    style: "Industrial gray, amber highlights.",
    specific: [
      { questionId: "site-content", value: "Search, part page, quote request, and about." },
      { questionId: "site-pages", value: JSON.stringify(["Home", "Products or shop", "Contact"]) },
      { questionId: "site-copy", value: "We have all of it" },
      { questionId: "site-updates", value: "Often by us" },
    ],
  },
  {
    number: "REQ-SAMPLE-LANTERN",
    token: "smplantern001",
    clientName: "Wei Guo",
    clientEmail: "wei@lantern.example",
    clientCompany: "Red Lantern Trading",
    title: "Lantern trading lot",
    blurb: "Paperwork for one trading lot, plus an inspection note.",
    projectType: "ERP",
    phone: "13800001108",
    industry: "Logistics",
    city: "Shenzhen, China",
    description: "Track one lot from supplier to buyer, with the inspection result on the same record.",
    partner: "south-china-leads",
    currency: "CNY",
    purpose: "TRADING",
    invoiceStatus: "ISSUED",
    paymentMethod: "BANK_SLIP",
    quoteNumber: "QUO-SAMPLE-LANTERN",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-LT",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-TINV",
    ndaNumber: "NDA-SAMPLE-LANTERN",
    when: "2026-10-24T02:00:00.000Z",
    lines: [
      { description: "Trading lot record", quantity: 1, unitAmount: 68000 },
      { description: "Inspection note", quantity: 1, unitAmount: 3500, discountRate: 10 },
    ],
    kind: "A fix",
    change: "Run daily work",
    audience: "The trader and the inspector.",
    competitors: "Email threads.",
    success: "The lot has one page with the price and the inspection.",
    languages: ["Chinese", "English"],
    stack: ["Next.js", "TypeScript"],
    connections: ["Email"],
    hosting: "Neither",
    traffic: "Under 1,000",
    budget: "Over 50,000",
    launch: "2026-12-20",
    note: "This invoice is for the paperwork, not the goods.",
    liked: "https://example.com/trade-like",
    likedNote: "A single record, not a dashboard.",
    style: "Black and red, very little decoration.",
    specific: [
      { questionId: "erp-modules", value: JSON.stringify(["Sales", "Delivery"]) },
      { questionId: "erp-users", value: "1–5" },
      { questionId: "erp-current", value: "Email and a folder of PDFs." },
      { questionId: "erp-broken", value: "The inspection result gets lost." },
      { questionId: "erp-migrate", value: "No" },
      { questionId: "erp-integrations", value: "None. Email is enough." },
      { questionId: "erp-sites", value: "1 office" },
    ],
  },
  {
    number: "REQ-SAMPLE-MIRA",
    token: "smplmira00001",
    clientName: "Hannah Cole",
    clientEmail: "hannah@mira.example",
    clientCompany: "Mira School",
    title: "Mira School site",
    blurb: "A school site with an admissions form.",
    projectType: "Website",
    phone: "13800001109",
    industry: "Education",
    city: "Singapore",
    description: "Parents read the programs and send an admissions enquiry.",
    partner: null,
    currency: "USD",
    purpose: "WEB",
    invoiceStatus: "PAID",
    paymentMethod: "COMPANY_QR",
    quoteNumber: "QUO-SAMPLE-MIRA",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-MR",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-MINV",
    ndaNumber: "NDA-SAMPLE-MIRA",
    when: "2026-10-27T02:00:00.000Z",
    lines: [
      { description: "School website", quantity: 1, unitAmount: 4500 },
      { description: "Admissions form", quantity: 1, unitAmount: 900 },
    ],
    kind: "Redesign",
    change: "More leads",
    audience: "Parents comparing primary schools.",
    competitors: "Two nearby school sites.",
    success: "Admissions enquiries land in one list.",
    languages: ["English"],
    stack: ["Next.js", "TypeScript"],
    connections: ["Email"],
    hosting: "We have both",
    traffic: "1,000–10,000",
    budget: "3,000–5,000",
    launch: "2027-01-06",
    note: "Term dates change twice a year.",
    liked: "https://example.com/school-like",
    likedNote: "Clear programs, few slogans.",
    style: "Navy and cream.",
    specific: [
      { questionId: "site-content", value: "Home, programs, admissions, team, and contact." },
      { questionId: "site-pages", value: JSON.stringify(["Home", "About", "Team", "Contact"]) },
      { questionId: "site-copy", value: "We have some" },
      { questionId: "site-updates", value: "Rarely by us" },
    ],
  },
  {
    number: "REQ-SAMPLE-DEPOT",
    token: "smpldepot0001",
    clientName: "Chen Yu",
    clientEmail: "chenyu@depot.example",
    clientCompany: "North Depot",
    title: "North Depot warehouse",
    blurb: "A warehouse ERP for stock, delivery, and four team leads.",
    projectType: "ERP",
    phone: "13800001110",
    industry: "Logistics",
    city: "Dongguan, China",
    description: "Replace the depot whiteboard with stock, delivery runs, and a login for each lead.",
    partner: "sample-partner",
    currency: "CNY",
    purpose: "WEB",
    invoiceStatus: "PAID",
    paymentMethod: "BANK_SLIP",
    quoteNumber: "QUO-SAMPLE-DEPOT",
    contractNumber: "MAGPIE-STUDIO-SAMPLE-DP",
    invoiceNumber: "MAGPIE-STUDIO-SAMPLE-DINV",
    ndaNumber: "NDA-SAMPLE-DEPOT",
    when: "2026-10-30T02:00:00.000Z",
    lines: [
      { description: "Warehouse ERP", quantity: 1, unitAmount: 36000, discountRate: 10 },
      { description: "Lead training", quantity: 4, unitAmount: 800 },
    ],
    kind: "New build",
    change: "Run daily work",
    audience: "Four warehouse leads and the office.",
    competitors: "The whiteboard and a night-shift notebook.",
    success: "The morning count matches the system.",
    languages: ["Chinese"],
    stack: ["Next.js", "TypeScript", "Node.js"],
    connections: ["Email"],
    hosting: "Neither",
    traffic: "Under 1,000",
    budget: "15,000–50,000",
    launch: "2027-04-01",
    note: "Training is on site, one morning.",
    liked: "https://example.com/depot-like",
    likedNote: "Big buttons. Gloves on.",
    style: "High contrast, yellow on charcoal.",
    specific: [
      { questionId: "erp-modules", value: JSON.stringify(["Inventory", "Delivery"]) },
      { questionId: "erp-users", value: "6–20" },
      { questionId: "erp-current", value: "A whiteboard." },
      { questionId: "erp-broken", value: "The night shift does not see the day shift notes." },
      { questionId: "erp-migrate", value: "Not sure" },
      { questionId: "erp-integrations", value: "None for launch." },
      { questionId: "erp-sites", value: "1 warehouse" },
    ],
  },
];

function answersFor(dossier: Dossier) {
  const rows: { questionId: string; value: string }[] = [
    { questionId: "company-name", value: dossier.clientCompany },
    { questionId: "contact-name", value: dossier.clientName },
    { questionId: "work-email", value: dossier.clientEmail },
    { questionId: "phone", value: dossier.phone },
    { questionId: "industry", value: dossier.industry },
    { questionId: "city-country", value: dossier.city },
    { questionId: "project-type", value: dossier.projectType },
    { questionId: "project-kind", value: dossier.kind },
    { questionId: "project-description", value: dossier.description },
    { questionId: "business-change", value: dossier.change },
    { questionId: "audience", value: dossier.audience },
    { questionId: "competitors", value: dossier.competitors },
    { questionId: "success", value: dossier.success },
    { questionId: "site-languages", value: JSON.stringify(dossier.languages) },
    { questionId: "dev-language", value: JSON.stringify(dossier.stack) },
    { questionId: "has-backend", value: "Please build it" },
    { questionId: "connections", value: JSON.stringify(dossier.connections) },
    { questionId: "domain-hosting", value: dossier.hosting },
    { questionId: "traffic", value: dossier.traffic },
    { questionId: "approver", value: dossier.clientName },
    { questionId: "has-budget", value: "Yes" },
    { questionId: "budget-range", value: dossier.budget },
    { questionId: "launch-date", value: dossier.launch },
    { questionId: "date-fixed", value: "No" },
    { questionId: "after-launch", value: "Yes" },
    { questionId: "anything-else", value: dossier.note },
    { questionId: "liked-sites", value: JSON.stringify([{ url: dossier.liked, note: dossier.likedNote }]) },
    { questionId: "has-logo", value: "Yes, I will send it later" },
    { questionId: "style-notes", value: dossier.style },
    ...dossier.specific.filter((row) => row.value),
  ];
  return rows;
}

function feeLines(dossier: Dossier) {
  return dossier.lines
    .map((line) => {
      const total = Math.round(line.quantity * line.unitAmount * 100) / 100;
      return `- ${line.description}: ${line.quantity} × ${money(line.unitAmount, dossier.currency)} = ${money(total, dossier.currency)}`;
    })
    .join("\n");
}

function contractBody(dossier: Dossier) {
  const total = dossier.lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitAmount * 100) / 100, 0);
  return [
    "Service agreement",
    "",
    `Between ${company.nameEn} (${company.nameZh}) and ${dossier.clientName} (${dossier.clientCompany}).`,
    "",
    `Project: ${dossier.title}`,
    `Scope: ${dossier.blurb}`,
    "",
    `Fees (${dossier.currency})`,
    feeLines(dossier),
    `Total: ${money(total, dossier.currency)}`,
    "",
    "Work begins after this agreement is signed. The invoice that follows uses these fees.",
    "",
    company.nameEn,
    company.address.replaceAll("\n", ", "),
    company.email,
  ].join("\n");
}

function ndaBody(dossier: Dossier) {
  return [
    "Non-disclosure agreement",
    "",
    `Between ${company.nameEn} (${company.nameZh}) and ${dossier.clientName} (${dossier.clientCompany}).`,
    "",
    "Both sides keep project files, prices, and client lists private.",
    `Signed by ${dossier.clientName} (${dossier.clientEmail}).`,
  ].join("\n");
}

function quoteLineData(lines: Line[]) {
  return lines.map((line, sort) => ({
    description: line.description,
    quantity: line.quantity,
    unitAmount: line.unitAmount,
    sort,
  }));
}

function invoiceLineData(lines: Line[]) {
  return lines.map((line, sort) => ({
    description: line.description,
    quantity: line.quantity,
    unitAmount: line.unitAmount,
    discountRate: line.discountRate ?? 0,
    sort,
  }));
}

async function ensurePartners() {
  const specs = [
    { code: "sample-partner", name: "Sample Partner", rate: 10 },
    { code: "south-china-leads", name: "South China Leads", rate: 8 },
    { code: "studio-referrals", name: "Studio Referrals", rate: 12 },
  ];
  const ids: Record<string, string> = {};
  for (const spec of specs) {
    const partner = await prisma.partner.upsert({
      where: { code: spec.code },
      update: { name: spec.name, commissionRate: spec.rate, sample: true },
      create: { name: spec.name, code: spec.code, commissionRate: spec.rate, sample: true },
    });
    ids[spec.code] = partner.id;
  }
  return ids;
}

async function writeDossier(dossier: Dossier, partners: Record<string, string>) {
  const when = new Date(dossier.when);
  const summary = `${marker} ${dossier.blurb}`;
  const partnerId = dossier.partner ? partners[dossier.partner] : null;
  const answers = answersFor(dossier);
  const existing = await prisma.requirement.findUnique({
    where: { number: dossier.number },
    include: { quotation: { include: { contract: { include: { invoice: true } } } }, nda: true },
  });

  const requirementData = {
    clientName: dossier.clientName,
    clientEmail: dossier.clientEmail,
    clientCompany: dossier.clientCompany,
    title: dossier.title,
    summary,
    briefStatus: "SIGNED" as const,
    status: "READY" as const,
    sample: true,
    signedInName: dossier.clientName,
    signedInEmail: dossier.clientEmail,
    signedInAt: when,
    confirmedAt: when,
    correctionNote: "",
    partnerId,
  };

  const invoiceData = {
    number: dossier.invoiceNumber,
    purpose: dossier.purpose,
    clientName: dossier.clientName,
    clientCompany: dossier.clientCompany,
    title: dossier.title,
    currency: dossier.currency,
    status: dossier.invoiceStatus,
    paymentMethod: dossier.paymentMethod,
    issuedAt: dossier.invoiceStatus === "DRAFT" ? null : when,
    paidAt: dossier.invoiceStatus === "PAID" ? when : null,
  };

  if (!existing) {
    const job = await prisma.requirement.create({
      data: {
        ...requirementData,
        number: dossier.number,
        shareToken: dossier.token,
        answers: { create: answers },
        nda: {
          create: {
            number: dossier.ndaNumber,
            body: ndaBody(dossier),
            status: "SIGNED",
            signerName: dossier.clientName,
            signerEmail: dossier.clientEmail,
            signedAt: when,
          },
        },
        quotation: {
          create: {
            number: dossier.quoteNumber,
            currency: dossier.currency,
            status: "ACCEPTED",
            lines: { create: quoteLineData(dossier.lines) },
            contract: {
              create: {
                number: dossier.contractNumber,
                body: contractBody(dossier),
                status: "SIGNED",
                signedAt: when,
                invoice: { create: { ...invoiceData, lines: { create: invoiceLineData(dossier.lines) } } },
              },
            },
          },
        },
      },
    });
    await prisma.deskNotice.create({
      data: { requirementId: job.id, kind: "SIGNED", message: `${dossier.title} is filled, signed, and ready to open.` },
    });
    return;
  }

  await prisma.requirement.update({ where: { id: existing.id }, data: requirementData });
  await prisma.requirementAnswer.deleteMany({ where: { requirementId: existing.id } });
  await prisma.requirementAnswer.createMany({
    data: answers.map((answer) => ({ requirementId: existing.id, ...answer })),
  });

  if (existing.nda) {
    await prisma.nda.update({
      where: { id: existing.nda.id },
      data: {
        body: ndaBody(dossier),
        status: "SIGNED",
        signerName: dossier.clientName,
        signerEmail: dossier.clientEmail,
        signedAt: when,
      },
    });
  } else {
    await prisma.nda.create({
      data: {
        number: dossier.ndaNumber,
        requirementId: existing.id,
        body: ndaBody(dossier),
        status: "SIGNED",
        signerName: dossier.clientName,
        signerEmail: dossier.clientEmail,
        signedAt: when,
      },
    });
  }

  const quotationId = existing.quotation?.id;
  if (!quotationId) {
    await prisma.quotation.create({
      data: {
        number: dossier.quoteNumber,
        requirementId: existing.id,
        currency: dossier.currency,
        status: "ACCEPTED",
        lines: { create: quoteLineData(dossier.lines) },
        contract: {
          create: {
            number: dossier.contractNumber,
            body: contractBody(dossier),
            status: "SIGNED",
            signedAt: when,
            invoice: { create: { ...invoiceData, lines: { create: invoiceLineData(dossier.lines) } } },
          },
        },
      },
    });
    return;
  } else {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { currency: dossier.currency, status: "ACCEPTED" },
    });
    await prisma.quotationLine.deleteMany({ where: { quotationId } });
    await prisma.quotationLine.createMany({
      data: quoteLineData(dossier.lines).map((line) => ({ ...line, quotationId: quotationId! })),
    });
  }

  const contractId = existing.quotation?.contract?.id;
  if (quotationId && !contractId) {
    await prisma.contract.create({
      data: {
        number: dossier.contractNumber,
        quotationId,
        body: contractBody(dossier),
        status: "SIGNED",
        signedAt: when,
        invoice: { create: { ...invoiceData, lines: { create: invoiceLineData(dossier.lines) } } },
      },
    });
    return;
  }

  if (!contractId) return;
  await prisma.contract.update({
    where: { id: contractId },
    data: { body: contractBody(dossier), status: "SIGNED", signedAt: when },
  });

  const invoiceId = existing.quotation?.contract?.invoice?.id;
  if (!invoiceId) {
    await prisma.invoice.create({
      data: { ...invoiceData, contractId, lines: { create: invoiceLineData(dossier.lines) } },
    });
    return;
  }

  await prisma.invoice.update({ where: { id: invoiceId }, data: invoiceData });
  await prisma.invoiceLine.deleteMany({ where: { invoiceId } });
  await prisma.invoiceLine.createMany({
    data: invoiceLineData(dossier.lines).map((line) => ({ ...line, invoiceId })),
  });
}

export async function ensurePipelineSamples() {
  const numbers = dossiers.map((dossier) => dossier.number);
  const found = await prisma.requirement.findMany({
    where: { number: { in: numbers } },
    select: { number: true, summary: true },
  });
  const ready = numbers.every((number) => found.some((row) => row.number === number && row.summary.startsWith(marker)));
  if (ready) return;

  const partners = await ensurePartners();
  for (const dossier of dossiers) {
    const row = found.find((item) => item.number === dossier.number);
    if (row?.summary.startsWith(marker)) continue;
    await writeDossier(dossier, partners);
  }

  await prisma.requirement.deleteMany({
    where: { sample: true, title: "Sample: Business website", quotation: { is: null } },
  });
}
