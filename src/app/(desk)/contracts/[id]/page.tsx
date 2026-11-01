import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Banner, StatusBadge } from "@/components/desk/DeskShell";
import { Chain } from "@/components/desk/Chain";
import { PaperSheet } from "@/components/desk/PaperSheet";
import { company } from "@/content/company";
import { createInvoice, deleteContract, saveContract, signContract } from "@/lib/mutations";
import { DeleteButton } from "@/components/desk/DeleteButton";
import { shanghaiDate, shanghaiDay } from "@/lib/money";
import { getContractPage, getPayments } from "@/lib/queries";

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const contract = await getContractPage(id);
  const job = contract?.quotation.requirement;
  if (!contract || !job || contract.id !== id) notFound();
  const payments = await getPayments();
  const signed = contract.status === "SIGNED";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={signed ? "Signed" : "Draft"} />
          {signed && contract.signedAt ? <StatusBadge label={shanghaiDate(contract.signedAt)} /> : null}
          <Button href={`/contracts/${contract.id}/pdf`} variant="outline" className="px-4 py-2">
            Download PDF
          </Button>
          <DeleteButton action={deleteContract} id={contract.id} confirmText={`Delete contract ${contract.number}? The invoice stays.`} />
        </div>
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
      </div>
      <Banner error={messages.error} notice={messages.notice} />
      <Chain
        current="contract"
        requirementId={job.id}
        quotationId={contract.quotation.id}
        contractId={contract.id}
        invoiceId={contract.invoice?.id}
      />
      <PaperSheet
        title="CONTRACT"
        number={contract.number}
        date={shanghaiDay(contract.signedAt ?? contract.createdAt)}
        companyName={payments.companyName}
        nameEn={company.nameEn}
        address={payments.address}
        phone={payments.phone}
        email={company.email}
        clientCompany={job.clientCompany}
        clientName={job.clientName}
        project={job.title}
      >
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#6b6560]">AGREEMENT</p>
        {signed ? (
          <div className="legal-zh mt-4 whitespace-pre-wrap text-sm leading-7 text-[#0f0f0f]">{contract.body}</div>
        ) : (
          <form action={saveContract} className="mt-4 grid gap-4">
            <input type="hidden" name="id" value={contract.id} />
            <textarea
              name="body"
              rows={16}
              defaultValue={contract.body}
              className="legal-zh w-full rounded-xl border border-[#e5dfd4] px-4 py-3 text-sm leading-7 text-[#0f0f0f] outline-none focus:border-[#5c2d91]"
            />
            <div className="flex justify-end">
              <Button type="submit">Save contract</Button>
            </div>
          </form>
        )}
      </PaperSheet>
      <p className="mt-4 text-sm text-gray-500">
        The requirement for this contract is{" "}
        <Link href={`/requirements/${job.id}`} className="font-medium text-brand-500">
          {job.number}
        </Link>
        .
      </p>
    </>
  );
}
