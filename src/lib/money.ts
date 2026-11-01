export function money(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase() || "USD";
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${code} ${formatted}`;
}

export function lineAmount(quantity: number, unitAmount: number): number {
  return Math.round(quantity * unitAmount * 100) / 100;
}

export function sumLines(lines: { quantity: { toString(): string }; unitAmount: { toString(): string } }[]): number {
  return lines.reduce((total, line) => {
    return total + lineAmount(Number(line.quantity), Number(line.unitAmount));
  }, 0);
}

export function asNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function currencyCode(value: string): string {
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
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
