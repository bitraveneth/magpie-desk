const currencySymbols: Record<string, string> = {
  CNY: "¥",
  RMB: "¥",
};

export function money(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase() || "USD";
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currencySymbols[code];
  return symbol ? `${symbol}${formatted}` : `${code} ${formatted}`;
}

export function lineAmount(quantity: number, unitAmount: number): number {
  return Math.round(quantity * unitAmount * 100) / 100;
}

export function discountRateOf(line: { discountRate?: { toString(): string } | number | null }): number {
  if (line.discountRate == null || line.discountRate === "") return 0;
  const rate = Number(line.discountRate);
  if (!Number.isFinite(rate)) return 0;
  return Math.min(100, Math.max(0, rate));
}

type MoneyLine = {
  quantity: { toString(): string } | number;
  unitAmount: { toString(): string } | number;
  discountRate?: { toString(): string } | number | null;
};

export function discountedLine(quantity: MoneyLine["quantity"], unitAmount: MoneyLine["unitAmount"], discountRate?: MoneyLine["discountRate"]) {
  const gross = lineAmount(Number(quantity), Number(unitAmount));
  const rate = discountRateOf({ discountRate });
  const discount = Math.round(gross * (rate / 100) * 100) / 100;
  return { rate, gross, discount, net: Math.round((gross - discount) * 100) / 100 };
}

export function invoiceTotals(lines: MoneyLine[]) {
  let subtotal = 0;
  let discount = 0;
  for (const line of lines) {
    const row = discountedLine(line.quantity, line.unitAmount, line.discountRate);
    subtotal += row.gross;
    discount += row.discount;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  discount = Math.round(discount * 100) / 100;
  return { subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100 };
}

export function sumLines(lines: MoneyLine[]): number {
  return invoiceTotals(lines).total;
}

export function asNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function currencyCode(value: string): string {
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

export function shanghaiDay(when: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(when);
}

export function shanghaiDate(when: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(when);
}
