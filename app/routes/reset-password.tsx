import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { Route } from "./+types/reset-password";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Reset Password" }];
}

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
    } else {
      setDone(true);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-foreground underline underline-offset-4">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-muted-foreground">Your password has been reset successfully.</p>
          <Link to="/login" className="text-sm font-medium text-foreground underline underline-offset-4">
            Sign in with your new password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-muted-foreground">Enter your new password below.</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11"
                disabled={isSubmitting}
                {...register("password")}
                aria-invalid={errors.password ? true : undefined}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11"
                disabled={isSubmitting}
                {...register("confirmPassword")}
                aria-invalid={errors.confirmPassword ? true : undefined}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
