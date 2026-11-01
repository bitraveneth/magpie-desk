import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { company } from "@/content/company";
import { createInvoice, saveContract, signContract } from "@/lib/mutations";
import { shanghaiDate } from "@/lib/money";
import { getJobByContract } from "@/lib/queries";

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const job = await getJobByContract(id);
  const contract = job?.quotation?.contract;
  if (!job || !job.quotation || !contract || contract.id !== id) notFound();
  const signed = contract.status === "SIGNED";

  return (
    <>
      <PageTitle
        kicker="Contract"
        title={contract.number}
        text="The number is the client company's first two words, the year, the date in Shanghai, and a unique code."
      />
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="contract"
        requirementId={job.id}
        quotationId={job.quotation.id}
        contractId={contract.id}
        invoiceId={contract.invoice?.id}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge>{signed ? "Signed" : "Draft"}</Badge>
        {signed && contract.signedAt ? <Badge>Signed {shanghaiDate(contract.signedAt)}</Badge> : null}
      </div>
      <Card>
        <p className="legal-zh text-sm text-muted">{company.nameZh}</p>
        <p className="mt-1 text-sm text-muted">{company.nameEn}</p>
        {signed ? (
          <pre className="mt-6 whitespace-pre-wrap text-sm leading-7">{contract.body}</pre>
        ) : (
          <form action={saveContract} className="mt-6 grid gap-4">
            <input type="hidden" name="id" value={contract.id} />
            <Textarea name="body" rows={16} defaultValue={contract.body} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="outline">
                Save contract
              </Button>
            </div>
          </form>
        )}
      </Card>
      <Card className="mt-6">
        {signed ? (
          contract.invoice ? (
            <Button href={`/invoices/${contract.invoice.id}`}>Open {contract.invoice.number}</Button>
          ) : (
            <form action={createInvoice}>
              <input type="hidden" name="contractId" value={contract.id} />
              <Button type="submit">Create invoice</Button>
            </form>
          )
        ) : (
          <form action={signContract}>
            <input type="hidden" name="id" value={contract.id} />
            <Button type="submit">Mark signed</Button>
          </form>
        )}
      </Card>
    </>
  );
}
