import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { createPartner } from "@/lib/mutations";

export default async function NewPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  return (
    <>
      <PageTitle kicker="Partners" title="New partner" text="Leave the rate blank until you know this partner's percent. There is no company-wide rate." />
      <Banner error={messages.error} notice={messages.notice} />
      <Card>
        <form action={createPartner} className="grid gap-4">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Commission rate (%)">
            <Input name="commissionRate" type="number" min="0" max="100" step="0.01" placeholder="Optional" />
          </Field>
          <Button type="submit">Create partner</Button>
        </form>
      </Card>
    </>
  );
}
