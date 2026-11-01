import type { Decimal } from "@prisma/client/runtime/library";
import { sumLines } from "@/lib/money";

type Line = { quantity: Decimal; unitAmount: Decimal };
type Requirement = {
  quotation: {
    contract: {
      invoice: { status: string; currency: string; lines: Line[] } | null;
    } | null;
  } | null;
};

export function commissionTotals(
  rate: Decimal | null,
  requirements: Requirement[],
): [string, number][] | null {
  if (rate == null) return null;
  const percent = Number(rate);
  const totals = new Map<string, number>();
  for (const requirement of requirements) {
    const invoice = requirement.quotation?.contract?.invoice;
    if (!invoice || invoice.status !== "PAID") continue;
    const commission = Math.round(sumLines(invoice.lines) * percent) / 100;
    totals.set(invoice.currency, (totals.get(invoice.currency) ?? 0) + commission);
  }
  return [...totals.entries()];
}
