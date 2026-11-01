"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Row = { key: string; description: string; quantity: string; unitAmount: string };

export function LineEditor({
  action,
  quotationId,
  currency,
  lines,
  locked,
}: {
  action: (formData: FormData) => void;
  quotationId: string;
  currency: string;
  lines: Row[];
  locked: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(
    lines.length > 0 ? lines : [{ key: "new-0", description: "", quantity: "1", unitAmount: "0" }],
  );

  if (locked) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 font-medium">Qty</th>
              <th className="py-2 font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-t border-border">
                <td className="py-3 pr-3">{line.description}</td>
                <td className="py-3 pr-3">{line.quantity}</td>
                <td className="py-3">
                  {currency} {line.unitAmount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={quotationId} />
      <label className="block max-w-40">
        <span className="mb-2 block text-sm font-semibold">Currency</span>
        <Input name="currency" defaultValue={currency} maxLength={3} />
      </label>
      {rows.map((row, index) => (
        <div key={row.key} className="grid gap-3 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Description</span>
            <Input name="description" defaultValue={row.description} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Qty</span>
            <Input name="quantity" type="number" min="0.01" step="0.01" defaultValue={row.quantity} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Unit amount</span>
            <Input name="unitAmount" type="number" min="0" step="0.01" defaultValue={row.unitAmount} />
          </label>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setRows((current) => [
              ...current,
              { key: `new-${current.length}-${Date.now()}`, description: "", quantity: "1", unitAmount: "0" },
            ])
          }
        >
          Add line
        </Button>
        <Button type="submit">Save lines</Button>
      </div>
    </form>
  );
}
