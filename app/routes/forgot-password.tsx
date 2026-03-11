import { type LoaderFunctionArgs, redirect, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { Route } from "./+types/forgot-password";
import { auth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Forgot Password" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/profile");
  return {};
}

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            If an account exists for that email address, we've sent a password reset link.
          </p>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11"
                disabled={isSubmitting}
                {...register("email")}
                aria-invalid={errors.email ? true : undefined}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
