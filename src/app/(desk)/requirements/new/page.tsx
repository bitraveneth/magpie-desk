import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { createRequirement } from "@/lib/mutations";

export default async function NewRequirementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  return (
    <>
      <PageTitle kicker="Requirements" title="New requirement" text="This creates a brief and a link you can send. It does not attach a partner." />
      <Banner error={messages.error} notice={messages.notice} />
      <Card>
        <form action={createRequirement} className="grid gap-4">
          <Field label="Client name">
            <Input name="clientName" required />
          </Field>
          <Field label="Client email">
            <Input name="clientEmail" type="email" />
          </Field>
          <Field label="Client company">
            <Input name="clientCompany" placeholder="Used in the contract number" />
          </Field>
          <Field label="Project title">
            <Input name="title" required />
          </Field>
          <Field label="Summary">
            <Textarea name="summary" rows={5} />
          </Field>
          <Button type="submit">Save requirement</Button>
        </form>
      </Card>
    </>
  );
}
