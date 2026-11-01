import { DeskShell, PageTitle } from "@/components/desk/DeskShell";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <DeskShell>
      <PageTitle kicker="Magpie Desk" title="That page is not here." />
      <Button href="/">Back to the desk</Button>
    </DeskShell>
  );
}
