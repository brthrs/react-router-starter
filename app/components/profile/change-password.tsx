import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import i18n from "~/lib/i18n";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, i18n.t("validation.currentPasswordRequired")),
    newPassword: z.string().min(8, i18n.t("validation.passwordMin8")),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: i18n.t("validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function ChangePassword() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (values: PasswordValues) => {
    setError(null);
    setSuccess(false);
    const { error: err } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: false,
    });
    if (err) {
      setError(err.message ?? t("errors.failedToUpdatePassword"));
    } else {
      setSuccess(true);
      form.reset();
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold">{t("profile.changePassword")}</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("common.currentPassword")}</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder={t("common.passwordPlaceholder")}
            className="h-11"
            {...form.register("currentPassword")}
            aria-invalid={form.formState.errors.currentPassword ? true : undefined}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("common.newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("common.passwordPlaceholder")}
            className="h-11"
            {...form.register("newPassword")}
            aria-invalid={form.formState.errors.newPassword ? true : undefined}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.newPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
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
            {...form.register("confirmPassword")}
            aria-invalid={form.formState.errors.confirmPassword ? true : undefined}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
            <p className="text-sm text-green-700 dark:text-green-400">
              {t("profile.passwordUpdated")}
            </p>
          </div>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? t("common.updating")
            : t("auth.resetPassword.updatePassword")}
        </Button>
      </form>
    </div>
  );
}
