import { type LoaderFunctionArgs, redirect, Link } from "react-router";
import { useNavigate, useSearchParams } from "react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Route } from "./+types/login";
import i18n from "~/lib/i18n";
import { auth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

const schema = z.object({
  email: z.string().email(i18n.t("validation.invalidEmail")),
  password: z.string().min(1, i18n.t("validation.passwordRequired")),
});

type FormValues = z.infer<typeof schema>;

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("auth.login.title") }];
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const successMessage =
    searchParams.get("registered") === "true"
      ? t("auth.login.registered")
      : searchParams.get("verified") === "true"
        ? t("auth.login.verified")
        : searchParams.get("invited") === "true"
          ? t("auth.login.inviteAccepted")
          : searchParams.get("deleted") === "true"
            ? t("auth.login.accountDeleted")
            : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    await authClient.signIn.email(
      { email: values.email, password: values.password },
      {
        onSuccess: (ctx) => {
          const role = (ctx.data?.user as { role?: string } | undefined)?.role;
          navigate(role === "admin" ? "/admin" : "/profile");
        },
        onError: (ctx) => {
          setServerError(ctx.error.message);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t("auth.login.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          {successMessage && (
            <div className="mb-6 rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
              <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("common.emailPlaceholder")}
                className="h-11"
                disabled={isSubmitting}
                aria-invalid={errors.email ? true : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("common.password")}</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("common.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("common.passwordPlaceholder")}
                className="h-11"
                disabled={isSubmitting}
                aria-invalid={errors.password ? true : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.signingIn") : t("common.signIn")}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("common.noAccount")}{" "}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
            {t("common.createOne")}
          </Link>
        </p>
      </div>
    </div>
  );
}
