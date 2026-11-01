import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner, Field } from "@/components/desk/DeskShell";
import { login } from "@/lib/auth-actions";
import { safeNextPath } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="brief-stage grid min-h-dvh place-items-center px-4 py-10">
      <Card className="w-full max-w-sm px-8 py-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="mx-auto h-14 w-auto" />
        <h1 className="display mt-6 text-4xl">Admin</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted">
          Sign in to the Magpie Desk. Requirement and partner links stay open without this login.
        </p>
        <div className="mt-5 text-left">
          <Banner error={params.error} />
        </div>
        <form action={login} className="grid gap-4 text-center">
          <input type="hidden" name="next" value={next} />
          <Field label="Username">
            <Input name="username" autoComplete="username" required className="text-center" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required className="text-center" />
          </Field>
          <Button type="submit" className="mt-2 w-full">
            Log in
          </Button>
        </form>
      </Card>
    </div>
  );
}
