import { DeskShell } from "@/components/desk/DeskShell";

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <DeskShell publicMode>{children}</DeskShell>;
}
