export type AnswerKindName = "SHORT" | "LONG" | "DROPDOWN" | "MULTI" | "URL" | "URLS" | "DATE" | "FILE";

export type QuestionSeed = {
  id: string;
  section: string;
  sectionLabel: string;
  sectionSort: number;
  sort: number;
  label: string;
  help: string;
  kind: AnswerKindName;
  options: string[];
  types: string[];
  required: boolean;
  locked: boolean;
  dependsOn: string;
  dependsValue: string;
};

const company = ["company", "Company", 1] as const;
const project = ["project", "Project", 2] as const;
const website = ["website", "Website content", 3] as const;
const app = ["app", "App", 4] as const;
const erp = ["erp", "ERP", 5] as const;
const brand = ["brand", "References and brand", 6] as const;
const technical = ["technical", "Technical", 7] as const;
const budget = ["budget", "Budget, time, and documents", 8] as const;

const fileHelp = "PDF, Word, PNG, JPEG, or WebP. Up to 8 MB each. You can add more than one file.";

function q(
  section: readonly [string, string, number],
  sort: number,
  id: string,
  label: string,
  kind: AnswerKindName,
  extra: Partial<Pick<QuestionSeed, "help" | "options" | "types" | "required" | "locked" | "dependsOn" | "dependsValue">> = {},
): QuestionSeed {
  return {
    id,
    section: section[0],
    sectionLabel: section[1],
    sectionSort: section[2],
    sort,
    label,
    help: extra.help ?? "",
    kind,
    options: extra.options ?? [],
    types: extra.types ?? [],
    required: extra.required ?? false,
    locked: extra.locked ?? false,
    dependsOn: extra.dependsOn ?? "",
    dependsValue: extra.dependsValue ?? "",
  };
}

export const questionBank: QuestionSeed[] = [
  q(company, 1, "company-name", "Company name", "SHORT", { required: true }),
  q(company, 2, "contact-name", "Your name and role", "SHORT", { required: true, help: "The person Magpie should talk to." }),
  q(company, 3, "work-email", "Work email", "SHORT", { required: true }),
  q(company, 4, "phone", "Phone or WhatsApp", "SHORT"),
  q(company, 5, "industry", "Industry", "DROPDOWN", {
    options: ["Retail", "Food", "Health", "Education", "Logistics", "Manufacturing", "Professional services", "Other"],
  }),
  q(company, 6, "city-country", "City and country", "SHORT"),

  q(project, 1, "project-type", "What do you need?", "DROPDOWN", {
    required: true,
    locked: true,
    help: "This chooses the website, app, or ERP questions that follow.",
    options: ["Website", "Mobile app", "ERP"],
  }),
  q(project, 2, "project-kind", "Is this a new build, a redesign, or a fix?", "DROPDOWN", {
    options: ["New build", "Redesign", "A fix"],
  }),
  q(project, 3, "project-description", "Describe the project in your own words", "LONG", { required: true }),
  q(project, 4, "business-change", "What should change for the business?", "DROPDOWN", {
    options: ["More sales", "More leads", "Run daily work", "Replace an old system", "Other"],
  }),
  q(project, 5, "audience", "Who will use it?", "LONG"),
  q(project, 6, "competitors", "Name competitors or similar products", "LONG"),
  q(project, 7, "success", "How will you know it worked?", "LONG"),

  q(website, 1, "site-content", "What content must be on the website?", "LONG", {
    types: ["WEBSITE"],
    required: true,
    help: "Name the pages and what each page should say.",
  }),
  q(website, 2, "site-pages", "Which pages are needed at launch?", "MULTI", {
    types: ["WEBSITE"],
    options: ["Home", "About", "Services", "Products or shop", "Portfolio", "Blog", "Team", "Pricing", "FAQ", "Careers", "Contact", "Other"],
  }),
  q(website, 3, "site-copy", "Who will write the words?", "DROPDOWN", {
    types: ["WEBSITE"],
    options: ["We have all of it", "We have some", "Magpie should write it"],
  }),
  q(website, 4, "site-updates", "How often will the content change, and who will change it?", "DROPDOWN", {
    types: ["WEBSITE"],
    options: ["Rarely by us", "Often by us", "Magpie will update it", "Not sure"],
  }),
  q(website, 5, "site-languages", "Which languages must the site support?", "SHORT", { types: ["WEBSITE"] }),
  q(website, 6, "site-files", "Upload product lists, copy, or a sitemap if you have them", "FILE", {
    types: ["WEBSITE"],
    help: fileHelp,
  }),

  q(app, 1, "app-phones", "Which phones?", "DROPDOWN", {
    types: ["APP"],
    options: ["iPhone", "Android", "Both"],
  }),
  q(app, 2, "app-accounts", "Do people need accounts?", "DROPDOWN", {
    types: ["APP"],
    options: ["Yes", "No", "Not sure"],
  }),
  q(app, 3, "app-jobs", "What are the main jobs the app must do?", "LONG", { types: ["APP"], required: true }),
  q(app, 4, "app-offline", "Must it work offline?", "DROPDOWN", {
    types: ["APP"],
    options: ["Yes", "No", "Not sure"],
  }),
  q(app, 5, "app-stores", "Do you already have App Store or Google Play accounts?", "DROPDOWN", {
    types: ["APP"],
    options: ["Yes", "We need help", "Not yet"],
  }),
  q(app, 6, "app-url", "Link to any current app", "URL", { types: ["APP"] }),

  q(erp, 1, "erp-modules", "Which parts do you need?", "MULTI", {
    types: ["ERP"],
    options: ["Sales", "Inventory", "Manufacturing", "Accounting", "HR", "CRM", "Delivery"],
  }),
  q(erp, 2, "erp-users", "How many staff will use it?", "DROPDOWN", {
    types: ["ERP"],
    options: ["1–5", "6–20", "21–100", "More than 100"],
  }),
  q(erp, 3, "erp-current", "What do you use today?", "SHORT", { types: ["ERP"] }),
  q(erp, 4, "erp-broken", "What is broken about it?", "LONG", { types: ["ERP"] }),
  q(erp, 5, "erp-migrate", "Do old records need to move into the new system?", "DROPDOWN", {
    types: ["ERP"],
    options: ["Yes", "No", "Not sure"],
  }),
  q(erp, 6, "erp-integrations", "Which other systems must connect, and how often?", "LONG", { types: ["ERP"] }),
  q(erp, 7, "erp-sites", "How many shops, offices, or warehouses?", "SHORT", { types: ["ERP"] }),

  q(brand, 1, "liked-sites", "Give up to three website URLs you like, and say what you like", "URLS", {
    help: "Add a link and a short note for each. Three is enough.",
  }),
  q(brand, 2, "disliked-url", "Give a URL you do not want it to look like, if you have one", "URL"),
  q(brand, 3, "has-logo", "Do you have a logo?", "DROPDOWN", {
    options: ["Yes, I will upload it", "Yes, I will send it later", "No, we need a logo"],
  }),
  q(brand, 4, "brand-files", "Upload the logo, brand guide, or photos", "FILE", { help: fileHelp }),
  q(brand, 5, "style-notes", "Colors or styles to use, and anything to avoid", "LONG"),

  q(technical, 1, "dev-language", "Preferred development language", "DROPDOWN", {
    options: ["No preference", "JavaScript or TypeScript", "PHP", "Python", "Java or C#", "Other"],
  }),
  q(technical, 2, "has-backend", "Do you already have a backend?", "DROPDOWN", {
    options: ["Please build it", "We already have one", "Not sure"],
  }),
  q(technical, 3, "connections", "What must it connect to?", "MULTI", {
    options: ["Card payments", "WeChat or Alipay", "WhatsApp", "Email", "CRM", "Analytics", "Other"],
  }),
  q(technical, 4, "domain-hosting", "Domain and hosting", "DROPDOWN", {
    options: ["We have both", "Domain only", "Neither", "Not sure"],
  }),
  q(technical, 5, "traffic", "Expected visits or users in the first year after launch", "DROPDOWN", {
    options: ["Under 1,000", "1,000–10,000", "10,000–100,000", "100,000–1 million", "Over 1 million", "Not sure"],
  }),
  q(technical, 6, "approver", "Who gives final approval?", "SHORT"),

  q(budget, 1, "has-budget", "Do you already have a budget in mind?", "DROPDOWN", {
    options: ["Yes", "No"],
  }),
  q(budget, 2, "budget-range", "Budget range", "DROPDOWN", {
    help: "In USD. Shown when you already have a budget in mind.",
    options: ["Under 1,000", "1,000–3,000", "3,000–5,000", "5,000–15,000", "15,000–50,000", "Over 50,000"],
    required: true,
    dependsOn: "has-budget",
    dependsValue: "Yes",
  }),
  q(budget, 3, "launch-date", "Target launch date", "DATE"),
  q(budget, 4, "date-fixed", "Is that date fixed to an event?", "DROPDOWN", {
    options: ["Yes", "No"],
  }),
  q(budget, 5, "after-launch", "Do you want Magpie to look after it after launch?", "DROPDOWN", {
    options: ["Yes", "No", "Not sure"],
  }),
  q(budget, 6, "documents", "Upload any brief, old proposal, spreadsheet, or other document", "FILE", { help: fileHelp }),
  q(budget, 7, "anything-else", "Anything else we should know before we ask more questions", "LONG"),
];
