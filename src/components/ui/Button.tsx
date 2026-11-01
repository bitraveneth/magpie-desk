import Link from "next/link";
import { cn } from "@/lib/utils";
import { getExternalLinkProps } from "@/lib/external-link";

const variants = {
  primary: "bg-accent text-white hover:bg-accent-strong shadow-lg shadow-accent/25",
  ghost: "border border-border bg-card/50 text-foreground hover:border-accent/40 hover:bg-accent/5",
  outline: "border border-accent/40 text-accent hover:bg-accent/10",
} as const;

type ButtonProps = {
  variant?: keyof typeof variants;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = "primary", href, className, children, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...getExternalLinkProps(href)}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
