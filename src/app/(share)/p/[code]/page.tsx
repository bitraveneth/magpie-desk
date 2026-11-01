import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, DeskShell, Field, PageTitle, SampleNote } from "@/components/desk/DeskShell";
import { company } from "@/content/company";
import { createRequirement } from "@/lib/mutations";
import { getPartnerByCode } from "@/lib/queries";

export default async function PartnerLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { code } = await params;
  const messages = await searchParams;
  const partner = await getPartnerByCode(code);
  if (!partner) notFound();

  return (
    <DeskShell publicMode>
      <PageTitle
        kicker="Partner link"
        title={`Start a requirement with ${partner.name}`}
        text={`This link belongs to ${partner.name}. Magpie Studio will attribute the requirement to them. You will get a separate requirement link after you submit.`}
      />
      <Banner error={messages.error} notice={messages.notice} />
      <SampleNote sample={partner.sample} />
      <Card className="mt-4">
        <form action={createRequirement} className="grid gap-4">
          <input type="hidden" name="partnerCode" value={partner.code} />
          <Field label="Your name">
            <Input name="clientName" required />
          </Field>
          <Field label="Email">
            <Input name="clientEmail" type="email" />
          </Field>
          <Field label="Company">
            <Input name="clientCompany" />
          </Field>
          <Field label="Project title">
            <Input name="title" required />
          </Field>
          <Field label="What you need">
            <Textarea name="summary" rows={5} />
          </Field>
          <Button type="submit">Start requirement</Button>
        </form>
        <p className="mt-4 text-sm text-muted">{company.nameEn}</p>
      </Card>
    </DeskShell>
  );
}
