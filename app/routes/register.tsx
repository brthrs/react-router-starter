import { type LoaderFunctionArgs, redirect, Link } from "react-router";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { Route } from "./+types/register";
import { auth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Register" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/profile");
  return {};
}

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    await authClient.signUp.email(
      { name: values.name, email: values.email, password: values.password },
      {
        onSuccess: () => navigate("/login?registered=true"),
        onError: (ctx) => setServerError(ctx.error.message),
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Create an account</h1>
          <p className="mt-2 text-muted-foreground">Sign up to get started</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className="h-11"
                disabled={isSubmitting}
                {...register("name")}
                aria-invalid={errors.name ? true : undefined}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
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
