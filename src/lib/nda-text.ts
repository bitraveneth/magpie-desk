import { company } from "@/content/company";

export function ndaBody(input: {
  clientName: string;
  clientCompany: string;
  title: string;
}): string {
  const client = input.clientName.trim() || "the client";
  const companyLine = input.clientCompany.trim()
    ? `${client} (${input.clientCompany.trim()})`
    : client;
  const project = input.title.trim() || "the project";

  return [
    "Non-disclosure agreement",
    "",
    `This NDA is between ${company.nameEn} (${company.nameZh}), "${company.publicName}", and ${companyLine}.`,
    "",
    `It covers information shared while discussing ${project}: briefs, pricing, designs, account access, and anything either side marks confidential.`,
    "",
    "Each side will use that information only for this work, keep it private, and return or delete it when asked. Information that is already public, already known, or required by law is not covered.",
    "",
    "This NDA lasts three years from the date it is signed. It does not transfer any intellectual property and it is not the service contract.",
    "",
    `${company.nameEn}`,
    company.address.replaceAll("\n", ", "),
    company.email,
  ].join("\n");
}
