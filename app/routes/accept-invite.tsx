import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import type { Route } from "./+types/accept-invite";
import { validateInviteToken, acceptInvite } from "~/services/invite.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ActionErrors {
  token?: string[];
  password?: string[];
  confirmPassword?: string[];
  form?: string[];
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Accept Invite - React Router Starter" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw new Response("Invalid invite link", { status: 400 });
  }

  const invite = await validateInviteToken(token);

  return { name: invite.name, email: invite.email, token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as ActionErrors };
  }

  const { token, password } = result.data;
  try {
    await acceptInvite(token, password);
  } catch {
    return { errors: { form: ["This invite is no longer valid"] } as ActionErrors };
  }

  return redirect("/login?invited=true");
}

export default function AcceptInvite() {
  const { name, email, token } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Set up your account</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome, {name}. Choose a password to activate your account.
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          {actionData?.errors?.form && (
            <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{actionData.errors.form[0]}</p>
            </div>
          )}

          <Form method="post" className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input value={name} disabled className="h-11 opacity-60" readOnly />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input value={email} disabled className="h-11 opacity-60" readOnly />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                className="h-11"
                disabled={isSubmitting}
                aria-invalid={actionData?.errors?.password ? true : undefined}
              />
              {actionData?.errors?.password && (
                <p className="text-sm text-destructive">{actionData.errors.password[0]}</p>
              )}
              <p className="text-sm text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                className="h-11"
                disabled={isSubmitting}
                aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
              />
              {actionData?.errors?.confirmPassword && (
                <p className="text-sm text-destructive">{actionData.errors.confirmPassword[0]}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Activating account..." : "Activate account"}
            </Button>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
