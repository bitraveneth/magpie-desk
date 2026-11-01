import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { invoiceNumberBase } from "@/lib/contract-number";
import { createDeskInvoice } from "@/lib/mutations";

const purposes = [
  ["WEB", "Web development"],
  ["PRODUCT", "Product purchase"],
  ["TRADING", "Trading"],
] as const;

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const sample = invoiceNumberBase("Kite Travel", new Date());

  return (
    <>
      <PageTitle
        kicker="Invoices"
        title="New invoice"
        text={`The number looks like ${invoiceNumberBase("", new Date())}. Add the other company and it becomes ${sample}.`}
      />
      <Banner error={messages.error} notice={messages.notice} />
      <Card>
        <form action={createDeskInvoice} className="grid gap-4">
          <Field label="What is this invoice for?">
            <select name="purpose" defaultValue="WEB" className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs">
              {purposes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Other company">
            <Input name="clientCompany" placeholder="Kite Travel" />
          </Field>
          <Field label="Contact name">
            <Input name="clientName" placeholder="Alex Cho" />
          </Field>
          <Field label="What you are billing">
            <Input name="title" placeholder="Shop website, spare parts, or a trading lot" />
          </Field>
          <Field label="Currency">
            <Input name="currency" defaultValue="CNY" maxLength={3} />
          </Field>
          <div>
            <Button type="submit">Create invoice</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
