import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { Route } from "./+types/reset-password";
import i18n from "~/lib/i18n";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("auth.resetPassword.title") }];
}

const schema = z
  .object({
    password: z.string().min(8, i18n.t("validation.passwordMin8")).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t("validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const { t } = useTranslation();
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
      setServerError(error.message ?? t("errors.somethingWentWrongRetry"));
    } else {
      setDone(true);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("auth.resetPassword.invalidLink")}</h1>
          <p className="text-muted-foreground">{t("auth.resetPassword.invalidLinkDescription")}</p>
          <Link to="/forgot-password" className="text-sm font-medium text-foreground underline underline-offset-4">
            {t("auth.resetPassword.requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("auth.resetPassword.passwordUpdated")}</h1>
          <p className="text-muted-foreground">{t("auth.resetPassword.passwordUpdatedDescription")}</p>
          <Link to="/login" className="text-sm font-medium text-foreground underline underline-offset-4">
            {t("auth.resetPassword.signInWithNewPassword")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t("auth.resetPassword.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("auth.resetPassword.subtitle")}</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.newPassword")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={t("common.passwordPlaceholder")}
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
              <Label htmlFor="confirmPassword">{t("common.confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t("common.passwordPlaceholder")}
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
              {isSubmitting ? t("common.updating") : t("auth.resetPassword.updatePassword")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
