"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { lineAmount, money } from "@/lib/money";

type Row = { key: string; description: string; quantity: string; unitAmount: string };

export function LineEditor({
  action,
  quotationId,
  currency,
  lines,
  locked,
  extra,
  submitLabel = "Save quotation",
}: {
  action: (formData: FormData) => void;
  quotationId: string;
  currency: string;
  lines: Row[];
  locked: boolean;
  extra?: React.ReactNode;
  submitLabel?: string;
}) {
  const [rows, setRows] = useState<Row[]>(
    lines.length > 0 ? lines : [{ key: "new-0", description: "", quantity: "1", unitAmount: "0" }],
  );
  const [moneyCode, setMoneyCode] = useState(currency);
  const shown = locked ? lines : rows;
  const total = shown.reduce((sum, row) => sum + lineAmount(Number(row.quantity) || 0, Number(row.unitAmount) || 0), 0);

  const table = (
    <div>
      {extra}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#5c2d91] text-[11px] tracking-[0.14em] text-white uppercase">
              <th className="rounded-l-lg px-3 py-3 font-medium">Description</th>
              <th className="px-3 py-3 font-medium">Qty</th>
              <th className="px-3 py-3 font-medium">Unit price</th>
              <th className={`px-3 py-3 text-right font-medium ${locked ? "rounded-r-lg" : ""}`}>Amount</th>
              {locked ? null : <th className="w-16 rounded-r-lg" />}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => {
              const amount = lineAmount(Number(row.quantity) || 0, Number(row.unitAmount) || 0);
              return (
                <tr key={row.key} className={index % 2 === 1 ? "bg-[#fbf9f6]" : "bg-white"}>
                  <td className="border-b border-[#f0ebe3] px-3 py-3">
                    {locked ? (
                      <span className="font-medium text-[#0f0f0f]">{row.description}</span>
                    ) : (
                      <input
                        name="description"
                        defaultValue={row.description}
                        placeholder="What this price covers"
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
                  <td className="border-b border-[#f0ebe3] px-3 py-3 text-right font-semibold text-[#0f0f0f]">
                    {money(amount, moneyCode)}
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
            setRows((current) => [...current, { key: `new-${current.length}-${Date.now()}`, description: "", quantity: "1", unitAmount: "0" }])
          }
        >
          Add line
        </button>
      )}
      <div className="mt-6 flex justify-end">
        <div className="flex w-full max-w-sm items-center justify-between rounded-xl bg-[#5c2d91] px-4 py-3 text-white">
          <span className="text-base font-semibold">Total</span>
          <span className="text-base font-semibold">{money(Math.round(total * 100) / 100, moneyCode)}</span>
        </div>
      </div>
      {locked ? null : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe3] pt-4">
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
          <Button type="submit">{submitLabel}</Button>
        </div>
      )}
    </div>
  );

  function update(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  if (locked) return table;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={quotationId} />
      {table}
    </form>
  );
}
