import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { addBankAccount, deleteBankAccount, savePayments, useBankAccount } from "@/lib/mutations";
import { DeleteButton } from "@/components/desk/DeleteButton";
import { getPayments, listBankAccounts } from "@/lib/queries";

const fieldClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-500";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const [payments, accounts] = await Promise.all([getPayments(), listBankAccounts()]);

  return (
    <>
      <PageTitle kicker="Payments" title="Bank accounts" text="Invoices use the account marked for invoices. Add another card when you open a new account." />
      <Banner error={messages.error} notice={messages.notice} />
      <div className="grid gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <article key={account.id} className="overflow-hidden rounded-2xl border border-[#e5dfd4] bg-white shadow-[0_18px_40px_rgba(15,15,15,0.06)]">
            <header className="bg-[#5c2d91] px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-white/70">COMPANY</p>
                {account.isDefault ? <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">On invoices</span> : null}
              </div>
              <h2 className="legal-zh mt-2 text-2xl font-semibold">{payments.companyName}</h2>
              {account.accountName && account.accountName !== payments.companyName ? (
                <p className="legal-zh mt-1 text-sm text-white/80">{account.accountName}</p>
              ) : null}
            </header>
            <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-500">Bank name</dt>
                <dd className="legal-zh mt-1 text-base font-semibold text-gray-900">{account.bankName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Branch name</dt>
                <dd className="legal-zh mt-1 text-base font-semibold text-gray-900">{account.branchName || "—"}</dd>
              </div>
              <div className="rounded-xl bg-[#f6f2ea] px-4 py-3 sm:col-span-2">
                <dt className="text-xs text-[#6b6560]">Account number</dt>
                <dd className="mt-1 font-mono text-xl tracking-wide text-[#0f0f0f]">{account.accountNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Tax number</dt>
                <dd className="mt-1 font-medium text-gray-900">{payments.taxNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Phone</dt>
                <dd className="mt-1 font-medium text-gray-900">{payments.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-gray-500">Company address</dt>
                <dd className="legal-zh mt-1 leading-6 text-gray-800">{payments.address}</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
              {account.isDefault ? <span /> : (
                <form action={useBankAccount}>
                  <input type="hidden" name="id" value={account.id} />
                  <Button type="submit" variant="outline" className="px-3 py-2">
                    Use on invoices
                  </Button>
                </form>
              )}
              <DeleteButton action={deleteBankAccount} id={account.id} confirmText={`Delete the ${account.bankName} account?`} />
            </div>
          </article>
        ))}
        <article className="rounded-2xl border border-dashed border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">Add a bank account</h2>
          <form action={addBankAccount} className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Bank name</span>
              <input name="bankName" required className={fieldClass} placeholder="平安银行" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Branch name</span>
              <input name="branchName" required className={fieldClass} placeholder="深圳新城支行" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Account name</span>
              <input name="accountName" className={fieldClass} placeholder={payments.companyName} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Account number</span>
              <input name="accountNumber" required className={`${fieldClass} font-mono`} />
            </label>
            <Button type="submit">Add bank account</Button>
          </form>
        </article>
      </div>
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-800">Company details</h2>
        <p className="mt-1 text-sm text-gray-500">These print on the invoice with the bank account you chose.</p>
        <form action={savePayments} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Company name</span>
            <input name="companyName" defaultValue={payments.companyName} className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Tax number</span>
            <input name="taxNumber" defaultValue={payments.taxNumber} className={fieldClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-500">Address</span>
            <Textarea name="address" rows={3} defaultValue={payments.address} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Phone</span>
            <input name="phone" defaultValue={payments.phone} className={fieldClass} />
          </label>
          <div className="flex items-end">
            <Button type="submit">Save company details</Button>
          </div>
        </form>
      </section>
    </>
  );
}
