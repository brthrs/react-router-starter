import { redirect } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/setup-2fa";
import i18n from "~/lib/i18n";
import { requireAuth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RouteErrorBoundary } from "~/components/route-error-boundary";

const passwordSchema = z.object({
  password: z.string().min(1, i18n.t("validation.passwordRequired")),
});
type PasswordValues = z.infer<typeof passwordSchema>;

const codeSchema = z.object({
  code: z.string().length(6, i18n.t("validation.codeMustBe6Digits")),
});
type CodeValues = z.infer<typeof codeSchema>;

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("auth.setup2fa.title") }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const twoFactorEnabled =
    (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false;
  if (twoFactorEnabled) {
    const role = (session.user as { role?: string }).role;
    throw redirect(role === "admin" ? "/admin" : "/profile");
  }
  return { role: (session.user as { role?: string }).role as string };
}

type SetupState =
  | { step: "password" }
  | { step: "qr"; totpURI: string; backupCodes: string[] }
  | { step: "done" };

export default function SetupTwoFactor({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<SetupState>({ step: "password" });
  const [error, setError] = useState<string | null>(null);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema) });

  useEffect(() => {
    if (state.step === "done") {
      const timer = setTimeout(() => {
        navigate(loaderData.role === "admin" ? "/admin" : "/profile");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.step, loaderData.role, navigate]);

  const handlePasswordSubmit = async (values: PasswordValues) => {
    setError(null);
    const { data, error: err } = await authClient.twoFactor.enable({
      password: values.password,
    });
    if (err || !data) {
      setError(err?.message ?? t("errors.failedToEnable2fa"));
      return;
    }
    setState({ step: "qr", totpURI: data.totpURI, backupCodes: data.backupCodes });
  };

  const handleCodeSubmit = async (values: CodeValues) => {
    setError(null);
    const { error: err } = await authClient.twoFactor.verifyTotp({
      code: values.code,
    });
    if (err) {
      setError(err.message ?? t("errors.invalidCodeRetry"));
      return;
    }
    setState({ step: "done" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">
              {t("auth.setup2fa.title")}
            </h1>
          </div>
          <div className="flex justify-center mt-2 mb-1">
            <span className="inline-flex items-center rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-xs font-medium text-destructive">
              {t("auth.setup2fa.required")}
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">{t("auth.setup2fa.subtitle")}</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8 space-y-6">
          {state.step === "password" && (
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {t("profile.twoFactor.setupPrompt")}
              </p>
              <div className="space-y-2">
                <Label htmlFor="password">{t("common.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("common.passwordPlaceholder")}
                  className="h-11"
                  disabled={passwordForm.formState.isSubmitting}
                  {...passwordForm.register("password")}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting
                  ? t("common.loading")
                  : t("profile.twoFactor.setUp")}
              </Button>
            </form>
          )}

          {state.step === "qr" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("profile.twoFactor.scanQr")}</p>
                <div className="flex justify-center p-4 bg-white rounded-lg w-fit mx-auto">
                  <QRCodeSVG value={state.totpURI} size={180} />
                </div>
                <p className="text-xs text-muted-foreground break-all font-mono">
                  {state.totpURI}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {t("profile.twoFactor.saveBackupCodes")}
                </p>
                <BackupCodeGrid codes={state.backupCodes} />
                <p className="text-xs text-muted-foreground">
                  {t("profile.twoFactor.backupCodesNote")}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("profile.twoFactor.verifyStep")}</p>
                <form
                  onSubmit={codeForm.handleSubmit(handleCodeSubmit)}
                  className="flex gap-2"
                >
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    className="h-11 w-40 text-center tracking-widest text-lg"
                    disabled={codeForm.formState.isSubmitting}
                    autoFocus
                    {...codeForm.register("code")}
                  />
                  <Button
                    type="submit"
                    className="h-11"
                    disabled={codeForm.formState.isSubmitting}
                  >
                    {codeForm.formState.isSubmitting
                      ? t("common.verifying")
                      : t("profile.twoFactor.verifyAndActivate")}
                  </Button>
                </form>
                {(codeForm.formState.errors.code || error) && (
                  <p className="text-sm text-destructive">
                    {codeForm.formState.errors.code?.message ?? error}
                  </p>
                )}
              </div>
            </div>
          )}

          {state.step === "done" && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                {t("auth.setup2fa.activated")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackupCodeGrid({ codes }: { codes: string[] }) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4 grid grid-cols-2 gap-2">
      {codes.map((c) => (
        <code key={c} className="text-xs font-mono text-foreground">
          {c}
        </code>
      ))}
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
