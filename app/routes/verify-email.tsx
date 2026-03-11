import { type LoaderFunctionArgs, redirect } from "react-router";
import { Link } from "react-router";
import type { Route } from "./+types/verify-email";
import { auth } from "~/lib/auth/server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Verify Email" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { success: false, error: "Missing verification token." };
  }

  try {
    await auth.api.verifyEmail({ query: { token } });
    throw redirect("/login?verified=true");
  } catch (err) {
    if (err instanceof Response) throw err;
    return { success: false, error: "This verification link is invalid or has expired." };
  }
}

export default function VerifyEmail({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData as { success: boolean; error?: string };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Email verification failed</h1>
        <p className="text-muted-foreground">{error}</p>
        <Link
          to="/login"
          className="inline-block text-sm font-medium text-foreground underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
