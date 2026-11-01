import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { savePayments } from "@/lib/mutations";
import { getPayments } from "@/lib/queries";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const payments = await getPayments();

  return (
    <>
      <PageTitle
        kicker="Payments"
        title="Company QR or bank slip"
        text="These details stay empty until you add them. An invoice shows only the one you choose."
      />
      <Banner error={messages.error} notice={messages.notice} />
      <Card>
        <form action={savePayments} className="grid gap-4">
          <Field label="Bank name">
            <Input name="bankName" defaultValue={payments.bankName} />
          </Field>
          <Field label="Account name">
            <Input name="accountName" defaultValue={payments.accountName} />
          </Field>
          <Field label="Account number">
            <Input name="accountNumber" defaultValue={payments.accountNumber} />
          </Field>
          <Field label="Company payment QR">
            <Input name="qr" type="file" accept="image/png,image/jpeg,image/webp" />
          </Field>
          {payments.qrImage ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeQr" value="yes" />
              Remove the current QR
            </label>
          ) : null}
          {payments.qrImage ? (
            <Image
              src="/files/qr"
              alt="Current company QR"
              width={160}
              height={160}
              unoptimized
              className="w-40 rounded-2xl border border-border"
            />
          ) : (
            <p className="text-sm text-muted">No QR uploaded.</p>
          )}
          <Field label="Bank slip image">
            <Input name="slip" type="file" accept="image/png,image/jpeg,image/webp" />
          </Field>
          {payments.slipImage ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeSlip" value="yes" />
              Remove the current slip
            </label>
          ) : null}
          {payments.slipImage ? (
            <Image
              src="/files/slip"
              alt="Current bank slip"
              width={384}
              height={256}
              unoptimized
              className="h-auto max-w-sm rounded-2xl border border-border"
            />
          ) : (
            <p className="text-sm text-muted">No slip uploaded.</p>
          )}
          <Button type="submit">Save payment settings</Button>
        </form>
      </Card>
    </>
  );
}
