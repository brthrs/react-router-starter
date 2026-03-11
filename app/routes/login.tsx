import { type LoaderFunctionArgs, redirect, Link } from "react-router";
import { useNavigate, useSearchParams } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/login";
import { auth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign In" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    const role = (session.user as { role?: string }).role;
    throw redirect(role === "admin" ? "/admin" : "/profile");
  }
  return {};
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successMessage =
    searchParams.get("registered") === "true"
      ? "Account created! Please check your email to verify your address."
      : searchParams.get("verified") === "true"
        ? "Email verified! You can now sign in."
        : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: (ctx) => {
          const role = (ctx.data?.user as { role?: string } | undefined)?.role;
          navigate(role === "admin" ? "/admin" : "/profile");
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          {successMessage && (
            <div className="mb-6 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
              <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="h-11"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-11"
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
