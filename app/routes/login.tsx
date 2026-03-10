import { type LoaderFunctionArgs, redirect } from "react-router";
import { useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/login";
import { auth } from "~/lib/auth.server";
import { authClient } from "~/lib/auth-client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Login - Railcenter Datalake Admin" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session) {
    throw redirect("/admin");
  }

  return {};
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          navigate("/admin");
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
          <h1 className="text-4xl font-bold tracking-tight">Railcenter Datalake Admin</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your account
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
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
                placeholder="Enter your email"
                className="h-11"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
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
      </div>
    </div>
  );
}
