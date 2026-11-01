import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { createDeskQuotation } from "@/lib/mutations";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;

  return (
    <>
      <PageTitle kicker="Quotations" title="New quotation" text="A quotation is the price offer. You can open one without waiting for a signed brief." />
      <Banner error={messages.error} notice={messages.notice} />
      <Card>
        <form action={createDeskQuotation} className="grid gap-4">
          <Field label="Other company">
            <Input name="clientCompany" placeholder="Kite Travel" />
          </Field>
          <Field label="Contact name">
            <Input name="clientName" placeholder="Alex Cho" />
          </Field>
          <Field label="What this price is for">
            <Input name="title" placeholder="Shop website" />
          </Field>
          <Field label="Currency">
            <Input name="currency" defaultValue="CNY" maxLength={3} />
          </Field>
          <div>
            <Button type="submit">Create quotation</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
