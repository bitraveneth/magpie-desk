export const company = {
  publicName: "Magpie Studio",
  nameEn: "Shenzhen Magpie Technology Co., Ltd.",
  nameZh: "深圳市喜鹊派科技有限公司",
  email: "hello@magpiestudio.com",
  address: "15A-2, Financial Technology Building\n11 Keyuan Road, Nanshan\nShenzhen, China",
  url: "https://magpiestudio.com",
} as const;

export const quoteTemplates = [
  { id: "starter", name: "Starter", detail: "Up to 3 pages", amount: 1000, cadence: "project" },
  { id: "business", name: "Business", detail: "Up to 8 pages", amount: 3000, cadence: "project" },
  { id: "premium", name: "Premium", detail: "Custom functionality", amount: 5000, cadence: "project" },
  { id: "essentials", name: "Essentials", detail: "One ad platform", amount: 750, cadence: "month" },
  { id: "growth", name: "Growth", detail: "Meta and Google ads", amount: 1000, cadence: "month" },
  { id: "scale", name: "Scale", detail: "Hands-on growth support", amount: 1500, cadence: "month" },
] as const;

export type QuoteTemplateId = (typeof quoteTemplates)[number]["id"];
