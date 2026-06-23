import { type LoaderFunctionArgs, redirect, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { Route } from "./+types/forgot-password";
import i18n from "~/lib/i18n";
import { auth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("auth.forgotPassword.title") }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/profile");
  return {};
}

const schema = z.object({
  email: z.email(i18n.t("validation.invalidEmail")),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { t } = useTranslation();
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
      setServerError(error.message ?? t("errors.somethingWentWrongRetry"));
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            {t("auth.forgotPassword.checkEmail")}
          </h1>
          <p className="text-muted-foreground">{t("auth.forgotPassword.checkEmailDescription")}</p>
          <Link
            to="/login"
            className="inline-block text-sm font-medium text-foreground underline underline-offset-4"
          >
            {t("common.backToSignIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t("auth.forgotPassword.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("auth.forgotPassword.subtitle")}</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
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
                {...register("email")}
                aria-invalid={errors.email ? true : undefined}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? t("common.sending") : t("auth.forgotPassword.sendResetLink")}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.forgotPassword.rememberPassword")}{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
