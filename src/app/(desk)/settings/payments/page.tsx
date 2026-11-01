import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { addBankAccount, savePayments, useBankAccount } from "@/lib/mutations";
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <article key={account.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Bank</p>
              {account.isDefault ? <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500">On invoices</span> : null}
            </div>
            <h2 className="legal-zh mt-3 text-lg font-semibold text-gray-800">{account.bankName}</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Account name</dt>
                <dd className="legal-zh mt-1 font-medium text-gray-800">{account.accountName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Account number</dt>
                <dd className="mt-1 font-mono text-base tracking-wide text-gray-900">{account.accountNumber}</dd>
              </div>
            </dl>
            {account.isDefault ? null : (
              <form action={useBankAccount} className="mt-5">
                <input type="hidden" name="id" value={account.id} />
                <Button type="submit" variant="outline" className="px-3 py-2">
                  Use on invoices
                </Button>
              </form>
            )}
          </article>
        ))}
        <article className="rounded-2xl border border-dashed border-gray-300 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-800">Add a bank account</h2>
          <form action={addBankAccount} className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Bank name</span>
              <input name="bankName" required className={fieldClass} placeholder="Bank and branch" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Account name</span>
              <input name="accountName" className={fieldClass} placeholder="Name on the account" />
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
