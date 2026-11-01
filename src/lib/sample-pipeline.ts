import { prisma } from "@/lib/db";

const sampleNumbers = [
  "REQ-SAMPLE-FILLED",
  "REQ-SAMPLE-SIGNED",
  "REQ-SAMPLE-QUOTE",
  "REQ-SAMPLE-CONTRACT",
  "REQ-SAMPLE-PAID",
] as const;

function answers(companyName: string, contact: string, email: string, projectType: string, description: string) {
  return [
    { questionId: "company-name", value: companyName },
    { questionId: "contact-name", value: contact },
    { questionId: "work-email", value: email },
    { questionId: "project-type", value: projectType },
    { questionId: "project-description", value: description },
  ];
}

export async function ensurePipelineSamples() {
  const existing = await prisma.requirement.findMany({
    where: { number: { in: [...sampleNumbers] } },
    select: { number: true },
  });
  if (existing.length === sampleNumbers.length) return;
  const have = new Set(existing.map((row) => row.number));

    const partner = await prisma.partner.upsert({
      where: { code: "sample-partner" },
      update: {},
      create: { name: "Sample Partner", code: "sample-partner", sample: true },
    });
    if (partner.commissionRate === null) {
      await prisma.partner.update({ where: { id: partner.id }, data: { commissionRate: 10 } });
    }

    const now = new Date();
    const signed = {
      briefStatus: "SIGNED" as const,
      status: "READY" as const,
      sample: true,
      signedInAt: now,
    };

    if (!have.has("REQ-SAMPLE-FILLED")) {
      const job = await prisma.requirement.create({
        data: {
          number: "REQ-SAMPLE-FILLED",
          shareToken: "smplfilled001",
          clientName: "Mei Lin",
          clientEmail: "mei@harbor.example",
          clientCompany: "Harbor Cafe",
          title: "Harbor Cafe website",
          summary: "Sample. A filled brief waiting for a signature.",
          briefStatus: "FILLED",
          status: "READY",
          sample: true,
          answers: { create: answers("Harbor Cafe", "Mei Lin", "mei@harbor.example", "Website", "A menu and booking site for two cafes.") },
        },
      });
      await prisma.deskNotice.create({
        data: {
          requirementId: job.id,
          kind: "FILLED",
          message: "Harbor Cafe website was filled in and is ready to review.",
        },
      });
    }

    if (!have.has("REQ-SAMPLE-SIGNED")) {
      const job = await prisma.requirement.create({
        data: {
          number: "REQ-SAMPLE-SIGNED",
          shareToken: "smplsigned001",
          clientName: "Dr. Chen",
          clientEmail: "chen@northline.example",
          clientCompany: "Northline Clinic",
          title: "Northline booking app",
          summary: "Sample. Signed, waiting for Magpie to confirm.",
          ...signed,
          signedInName: "Dr. Chen",
          signedInEmail: "chen@northline.example",
          answers: {
            create: answers("Northline Clinic", "Dr. Chen", "chen@northline.example", "Mobile app", "Appointment booking for patients and staff."),
          },
        },
      });
      await prisma.deskNotice.create({
        data: {
          requirementId: job.id,
          kind: "SIGNED",
          message: "Northline booking app was signed. Confirm it before the quotation.",
        },
      });
    }

    if (!have.has("REQ-SAMPLE-QUOTE")) {
      await prisma.requirement.create({
        data: {
          number: "REQ-SAMPLE-QUOTE",
          shareToken: "smplquote0001",
          clientName: "Alex Cho",
          clientEmail: "alex@lumen.example",
          clientCompany: "Lumen Retail",
          title: "Lumen shop website",
          summary: "Sample. Confirmed brief with a draft quotation.",
          ...signed,
          confirmedAt: now,
          signedInName: "Alex Cho",
          signedInEmail: "alex@lumen.example",
          partnerId: partner.id,
          answers: { create: answers("Lumen Retail", "Alex Cho", "alex@lumen.example", "Website", "A shop site with product pages.") },
          quotation: {
            create: {
              number: "QUO-SAMPLE-LUMEN",
              currency: "USD",
              status: "DRAFT",
              lines: { create: [{ description: "Business website — up to 8 pages", quantity: 1, unitAmount: 3000, sort: 0 }] },
            },
          },
        },
      });
    }

    if (!have.has("REQ-SAMPLE-CONTRACT")) {
      await prisma.requirement.create({
        data: {
          number: "REQ-SAMPLE-CONTRACT",
          shareToken: "smplcontract1",
          clientName: "Priya Shah",
          clientEmail: "priya@fieldwork.example",
          clientCompany: "Fieldwork Goods",
          title: "Fieldwork inventory",
          summary: "Sample. Accepted quotation and a signed contract.",
          ...signed,
          confirmedAt: now,
          signedInName: "Priya Shah",
          signedInEmail: "priya@fieldwork.example",
          answers: {
            create: answers("Fieldwork Goods", "Priya Shah", "priya@fieldwork.example", "ERP", "Inventory and purchasing for three warehouses."),
          },
          quotation: {
            create: {
              number: "QUO-SAMPLE-FIELD",
              currency: "USD",
              status: "ACCEPTED",
              lines: { create: [{ description: "ERP inventory module", quantity: 1, unitAmount: 8000, sort: 0 }] },
              contract: {
                create: {
                  number: "MAGPIE-STUDIO-SAMPLE-CT",
                  status: "SIGNED",
                  signedAt: now,
                  body: [
                    "Service agreement",
                    "",
                    "Between Shenzhen Magpie Technology Co., Ltd. (深圳市喜鹊派科技有限公司) and Priya Shah (Fieldwork Goods).",
                    "",
                    "Project: Fieldwork inventory",
                    "Fees (USD)",
                    "- ERP inventory module: 1 × USD 8000.00 = USD 8000.00",
                    "Total: USD 8000.00",
                  ].join("\n"),
                },
              },
            },
          },
        },
      });
    }

    if (!have.has("REQ-SAMPLE-PAID")) {
      await prisma.requirement.create({
        data: {
          number: "REQ-SAMPLE-PAID",
          shareToken: "smplpaid00001",
          clientName: "Owen Park",
          clientEmail: "owen@kite.example",
          clientCompany: "Kite Travel",
          title: "Kite Travel site",
          summary: "Sample. Signed contract and a paid invoice.",
          ...signed,
          confirmedAt: now,
          signedInName: "Owen Park",
          signedInEmail: "owen@kite.example",
          partnerId: partner.id,
          answers: { create: answers("Kite Travel", "Owen Park", "owen@kite.example", "Website", "A trip catalog with enquiry forms.") },
          quotation: {
            create: {
              number: "QUO-SAMPLE-KITE",
              currency: "USD",
              status: "ACCEPTED",
              lines: { create: [{ description: "Starter website — up to 3 pages", quantity: 1, unitAmount: 1000, sort: 0 }] },
              contract: {
                create: {
                  number: "MAGPIE-STUDIO-SAMPLE-PD",
                  status: "SIGNED",
                  signedAt: now,
                  body: [
                    "Service agreement",
                    "",
                    "Between Shenzhen Magpie Technology Co., Ltd. (深圳市喜鹊派科技有限公司) and Owen Park (Kite Travel).",
                    "",
                    "Project: Kite Travel site",
                    "Total: USD 1000.00",
                  ].join("\n"),
                  invoice: {
                    create: {
                      number: "MAGPIE-STUDIO-SAMPLE-INV",
                      currency: "USD",
                      status: "PAID",
                      paymentMethod: "COMPANY_QR",
                      issuedAt: now,
                      paidAt: now,
                      lines: { create: [{ description: "Starter website — up to 3 pages", quantity: 1, unitAmount: 1000, sort: 0 }] },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
}
