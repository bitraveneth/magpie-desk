import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export function Chain({
  requirementId,
  quotationId,
  contractId,
  invoiceId,
  current,
}: {
  requirementId: string;
  quotationId?: string | null;
  contractId?: string | null;
  invoiceId?: string | null;
  current: "requirement" | "quotation" | "contract" | "invoice";
}) {
  const steps = [
    { id: "requirement", label: "Requirement", href: `/requirements/${requirementId}` },
    { id: "quotation", label: "Quotation", href: quotationId ? `/quotations/${quotationId}` : null },
    { id: "contract", label: "Contract", href: contractId ? `/contracts/${contractId}` : null },
    { id: "invoice", label: "Invoice", href: invoiceId ? `/invoices/${invoiceId}` : null },
  ] as const;

  return (
    <ol className="mb-6 flex flex-wrap gap-2">
      {steps.map((step) => {
        const active = step.id === current;
        const className = active
          ? "border-accent/40 bg-accent text-white"
          : step.href
            ? "border-border bg-card text-foreground hover:border-accent/40"
            : "border-border bg-background text-muted";
        const body = <Badge className={className}>{step.label}</Badge>;
        return (
          <li key={step.id}>
            {step.href ? <Link href={step.href}>{body}</Link> : body}
          </li>
        );
      })}
    </ol>
  );
}
