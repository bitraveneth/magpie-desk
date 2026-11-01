"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { discountedLine, invoiceTotals, money } from "@/lib/money";

type Row = { key: string; description: string; quantity: string; unitAmount: string; discountRate: string };

const purposes = [
  ["WEB", "Web development"],
  ["PRODUCT", "Product purchase"],
  ["TRADING", "Trading"],
] as const;

export function InvoiceEditor({
  action,
  locked,
  invoiceId,
  number,
  date,
  currency,
  nameEn,
  purpose,
  title,
  clientName,
  clientCompany,
  lines,
  seller,
  showQr,
}: {
  action?: (formData: FormData) => void;
  locked: boolean;
  invoiceId: string;
  number: string;
  date: string;
  currency: string;
  nameEn: string;
  purpose: string;
  title: string;
  clientName: string;
  clientCompany: string;
  lines: Row[];
  seller: {
    companyName: string;
    taxNumber: string;
    address: string;
    phone: string;
    email: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  showQr: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(
    lines.length > 0 ? lines : [{ key: "new-0", description: "", quantity: "1", unitAmount: "0", discountRate: "0" }],
  );
  const [moneyCode, setMoneyCode] = useState(currency);
  const shown = locked ? lines : rows;
  const totals = invoiceTotals(
    shown.map((row) => ({
      quantity: Number(row.quantity) || 0,
      unitAmount: Number(row.unitAmount) || 0,
      discountRate: Number(row.discountRate) || 0,
    })),
  );
  const purposeLabel = purposes.find(([value]) => value === purpose)?.[1] ?? purpose;

  const sheet = (
    <article className="overflow-hidden rounded-2xl border border-[#e5dfd4] bg-white shadow-[0_22px_50px_rgba(15,15,15,0.06)]">
      <header className="flex flex-wrap items-center justify-between gap-8 bg-[#f6f2ea] px-6 py-8 sm:px-12 sm:py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-24 w-auto sm:h-32 lg:h-40" />
        <div className="text-left sm:text-right">
          <p className="text-[11px] font-semibold tracking-[0.32em] text-[#5c2d91]">MAGPIE STUDIO</p>
          <h1
            className="mt-1 text-4xl leading-none text-[#4a2476] sm:text-5xl"
            style={{ fontFamily: "var(--font-hero-title), sans-serif", letterSpacing: "0.06em" }}
          >
            INVOICE
          </h1>
          <p className="mt-4 text-lg font-semibold text-[#0f0f0f]">{number}</p>
          <p className="text-sm text-[#6b6560]">{date}</p>
        </div>
      </header>
      <div className="h-1.5 bg-[#5c2d91]" />

      <div className="grid gap-8 px-6 py-8 sm:px-12 md:grid-cols-2">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#6b6560]">FROM</p>
          <p className="legal-zh mt-3 text-lg font-semibold text-[#0f0f0f]">{seller.companyName}</p>
          <p className="mt-1 text-sm font-medium text-[#4a2476]">{nameEn}</p>
          <dl className="mt-4 space-y-1.5 text-sm text-[#3d3935]">
            <div className="legal-zh">{seller.address}</div>
            <div>
              <span className="text-[#6b6560]">Phone </span>
              {seller.phone}
            </div>
            <div>{seller.email}</div>
          </dl>
        </section>
        <section>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#6b6560]">BILL TO</p>
          {locked ? (
            <div className="mt-3">
              <p className="text-lg font-semibold text-[#0f0f0f]">{clientCompany || clientName || "Client"}</p>
              {clientCompany && clientName ? <p className="mt-1 text-sm text-[#3d3935]">{clientName}</p> : null}
              <p className="mt-3 text-sm text-[#4a2476]">{purposeLabel}</p>
              {title ? <p className="mt-1 text-sm text-[#3d3935]">{title}</p> : null}
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              <Field name="clientCompany" label="Company" defaultValue={clientCompany} />
              <Field name="clientName" label="Contact" defaultValue={clientName} />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6b6560]">Purpose</span>
                <select
                  name="purpose"
                  defaultValue={purpose}
                  className="h-10 w-full rounded-lg border border-[#e5dfd4] bg-white px-3 text-sm text-[#0f0f0f]"
                >
                  {purposes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <Field name="title" label="What this bill is for" defaultValue={title} />
            </div>
          )}
        </section>
      </div>

      <div className="px-6 sm:px-12">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#5c2d91] text-[11px] tracking-[0.14em] text-white uppercase">
                <th className="rounded-l-lg px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Qty</th>
                <th className="px-3 py-3 font-medium">Unit price</th>
                <th className="px-3 py-3 font-medium">Discount</th>
                <th className={`px-3 py-3 text-right font-medium ${locked ? "rounded-r-lg" : ""}`}>Amount</th>
                {locked ? null : <th className="w-16 rounded-r-lg" />}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, index) => {
                const priced = discountedLine(row.quantity, row.unitAmount, row.discountRate);
                const saving = priced.discount > 0;
                return (
                  <tr key={row.key} className={index % 2 === 1 ? "bg-[#fbf9f6]" : "bg-white"}>
                    <td className="border-b border-[#f0ebe3] px-3 py-3">
                      {locked ? (
                        <span className="font-medium text-[#0f0f0f]">{row.description}</span>
                      ) : (
                        <input
                          name="description"
                          defaultValue={row.description}
                          placeholder="What you are charging for"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[#0f0f0f] outline-none focus:border-[#e5dfd4]"
                          onChange={(event) => update(index, { description: event.target.value })}
                        />
                      )}
                    </td>
                    <td className="border-b border-[#f0ebe3] px-3 py-3 text-[#3d3935]">
                      {locked ? (
                        Number(row.quantity)
                      ) : (
                        <input
                          name="quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          defaultValue={row.quantity}
                          className="w-20 rounded-md border border-[#e5dfd4] bg-white px-2 py-1.5"
                          onChange={(event) => update(index, { quantity: event.target.value })}
                        />
                      )}
                    </td>
                    <td className="border-b border-[#f0ebe3] px-3 py-3 text-[#3d3935]">
                      {locked ? (
                        money(Number(row.unitAmount), moneyCode)
                      ) : (
                        <input
                          name="unitAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={row.unitAmount}
                          className="w-28 rounded-md border border-[#e5dfd4] bg-white px-2 py-1.5"
                          onChange={(event) => update(index, { unitAmount: event.target.value })}
                        />
                      )}
                    </td>
                    <td className="border-b border-[#f0ebe3] px-3 py-3">
                      {locked ? (
                        <span className={saving ? "font-semibold text-[#5c2d91]" : "text-[#6b6560]"}>{priced.rate}%</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <input
                            name="discountRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            defaultValue={row.discountRate}
                            className="w-20 rounded-md border border-[#e5dfd4] bg-white px-2 py-1.5"
                            onChange={(event) => update(index, { discountRate: event.target.value })}
                          />
                          <span className="text-[#6b6560]">%</span>
                        </span>
                      )}
                    </td>
                    <td className="border-b border-[#f0ebe3] px-3 py-3 text-right font-semibold text-[#0f0f0f]">
                      {money(priced.net, moneyCode)}
                    </td>
                    {locked ? null : (
                      <td className="border-b border-[#f0ebe3] py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-[#6b6560] hover:text-red-600"
                          onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {locked ? null : (
          <button
            type="button"
            className="mt-3 text-sm font-medium text-[#5c2d91]"
            onClick={() =>
              setRows((current) => [
                ...current,
                { key: `new-${current.length}-${Date.now()}`, description: "", quantity: "1", unitAmount: "0", discountRate: "0" },
              ])
            }
          >
            Add line
          </button>
        )}
      </div>

      <div className="mt-6 flex justify-end px-6 sm:px-12">
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#e5dfd4]">
          <TotalRow label="Subtotal" value={money(totals.subtotal, moneyCode)} />
          <TotalRow label="Discount" value={`− ${money(totals.discount, moneyCode)}`} accent />
          {totals.discount > 0 ? (
            <div className="flex items-center justify-between bg-[#f6f2ea] px-4 py-2.5 text-sm">
              <span className="font-medium text-[#4a2476]">You save</span>
              <span className="font-semibold text-[#4a2476]">{money(totals.discount, moneyCode)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between bg-[#5c2d91] px-4 py-3 text-white">
            <span className="text-base font-semibold">Total</span>
            <span className="text-base font-semibold">{money(totals.total, moneyCode)}</span>
          </div>
        </div>
      </div>

      <footer className="mx-6 mt-8 mb-8 rounded-2xl bg-[#f6f2ea] px-5 py-6 sm:mx-12 sm:px-6">
        <div className={`grid items-start gap-6 ${showQr ? "sm:grid-cols-[1fr_10rem]" : ""}`}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#4a2476]">PAY TO</p>
            <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Item label="Company" value={seller.companyName} />
              <Item label="Tax number" value={seller.taxNumber} />
              <Item label="Address" value={seller.address} />
              <Item label="Phone" value={seller.phone} />
              <Item label="Email" value={seller.email} />
              <Item label="Bank" value={seller.bankName} />
              <Item label="Account name" value={seller.accountName} />
              <Item label="Account number" value={seller.accountNumber} mono />
            </dl>
          </div>
          {showQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/files/qr"
              alt="Company payment QR"
              className="h-40 w-40 rounded-xl border border-[#e5dfd4] bg-white object-contain p-1"
            />
          ) : null}
        </div>
      </footer>

      {locked ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe3] px-6 py-4 sm:px-12">
          <label className="text-sm text-[#6b6560]">
            Currency
            <input
              name="currency"
              defaultValue={currency}
              maxLength={3}
              className="ml-2 h-10 w-20 rounded-lg border border-[#e5dfd4] px-2 uppercase"
              onChange={(event) => setMoneyCode(event.target.value.toUpperCase() || currency)}
            />
          </label>
          <Button type="submit">Save invoice</Button>
        </div>
      )}
    </article>
  );

  function update(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  if (locked || !action) return sheet;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={invoiceId} />
      {sheet}
    </form>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[#6b6560]">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-lg border border-[#e5dfd4] px-3 text-sm text-[#0f0f0f]"
      />
    </label>
  );
}

function Item({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-[#6b6560]">{label}</dt>
      <dd className={`legal-zh font-medium text-[#0f0f0f] ${mono ? "font-mono tracking-wide" : ""}`}>{value}</dd>
    </div>
  );
}

function TotalRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-[#6b6560]">{label}</span>
      <span className={accent ? "font-medium text-[#5c2d91]" : "text-[#0f0f0f]"}>{value}</span>
    </div>
  );
}
