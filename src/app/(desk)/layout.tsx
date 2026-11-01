import { DeskShell } from "@/components/desk/DeskShell";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <DeskShell>{children}</DeskShell>;
}
