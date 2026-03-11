import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

const enable2faSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
type Enable2faValues = z.infer<typeof enable2faSchema>;

const verify2faSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});
type Verify2faValues = z.infer<typeof verify2faSchema>;

const disable2faSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
type Disable2faValues = z.infer<typeof disable2faSchema>;

type Enable2faState =
  | { step: "idle" }
  | { step: "qr"; totpURI: string; backupCodes: string[] }
  | { step: "done"; backupCodes: string[] };

interface TwoFactorSectionProps {
  initialEnabled: boolean;
}

export function TwoFactorSection({ initialEnabled }: TwoFactorSectionProps) {
  const { t } = useTranslation();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialEnabled);
  const [enableState, setEnableState] = useState<Enable2faState>({ step: "idle" });
  const [enableError, setEnableError] = useState<string | null>(null);
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableSuccess, setDisableSuccess] = useState(false);

  const enableForm = useForm<Enable2faValues>({ resolver: zodResolver(enable2faSchema) });
  const verifyForm = useForm<Verify2faValues>({ resolver: zodResolver(verify2faSchema) });
  const disableForm = useForm<Disable2faValues>({ resolver: zodResolver(disable2faSchema) });

  const handleEnable = async (values: Enable2faValues) => {
    setEnableError(null);
    const { data, error } = await authClient.twoFactor.enable({ password: values.password });
    if (error || !data) {
      setEnableError(error?.message ?? "Failed to enable 2FA.");
      return;
    }
    setEnableState({ step: "qr", totpURI: data.totpURI, backupCodes: data.backupCodes });
  };

  const handleVerify = async (values: Verify2faValues) => {
    setEnableError(null);
    const { error } = await authClient.twoFactor.verifyTotp({ code: values.code });
    if (error) {
      setEnableError(error.message ?? "Invalid code. Please try again.");
      return;
    }
    if (enableState.step === "qr") {
      setTwoFactorEnabled(true);
      setEnableState({ step: "done", backupCodes: enableState.backupCodes });
    }
  };

  const handleDisable = async (values: Disable2faValues) => {
    setDisableError(null);
    setDisableSuccess(false);
    const { error } = await authClient.twoFactor.disable({ password: values.password });
    if (error) {
      setDisableError(error.message ?? "Failed to disable 2FA.");
      return;
    }
    setTwoFactorEnabled(false);
    setDisableSuccess(true);
    disableForm.reset();
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("profile.twoFactor.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("profile.twoFactor.description")}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            twoFactorEnabled
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {twoFactorEnabled ? t("profile.twoFactor.enabled") : t("profile.twoFactor.disabled")}
        </span>
      </div>

      {!twoFactorEnabled && enableState.step === "idle" && (
        <form onSubmit={enableForm.handleSubmit(handleEnable)} className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("profile.twoFactor.setupPrompt")}</p>
          <div className="space-y-2">
            <Label htmlFor="enable-password">{t("common.password")}</Label>
            <Input
              id="enable-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11"
              {...enableForm.register("password")}
              disabled={enableForm.formState.isSubmitting}
            />
            {enableForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {enableForm.formState.errors.password.message}
              </p>
            )}
          </div>
          {enableError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{enableError}</p>
            </div>
          )}
          <Button type="submit" disabled={enableForm.formState.isSubmitting}>
            {enableForm.formState.isSubmitting
              ? t("common.loading")
              : t("profile.twoFactor.setUp")}
          </Button>
        </form>
      )}

      {enableState.step === "qr" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("profile.twoFactor.scanQr")}</p>
            <div className="flex justify-center p-4 bg-white rounded-lg w-fit">
              <QRCodeSVG value={enableState.totpURI} size={180} />
            </div>
            <p className="text-xs text-muted-foreground break-all font-mono">
              {enableState.totpURI}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("profile.twoFactor.saveBackupCodes")}</p>
            <BackupCodeGrid codes={enableState.backupCodes} />
            <p className="text-xs text-muted-foreground">
              {t("profile.twoFactor.backupCodesNote")}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("profile.twoFactor.verifyStep")}</p>
            <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                className="h-11 w-40 text-center tracking-widest text-lg"
                {...verifyForm.register("code")}
                disabled={verifyForm.formState.isSubmitting}
                autoFocus
              />
              <Button
                type="submit"
                className="h-11"
                disabled={verifyForm.formState.isSubmitting}
              >
                {verifyForm.formState.isSubmitting
                  ? t("common.verifying")
                  : t("profile.twoFactor.verifyAndActivate")}
              </Button>
            </form>
            {(verifyForm.formState.errors.code || enableError) && (
              <p className="text-sm text-destructive">
                {verifyForm.formState.errors.code?.message ?? enableError}
              </p>
            )}
          </div>
        </div>
      )}

      {enableState.step === "done" && (
        <div className="space-y-4">
          <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
            <p className="text-sm text-green-700 dark:text-green-400">
              {t("profile.twoFactor.activated")}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("profile.twoFactor.yourBackupCodes")}</p>
            <BackupCodeGrid codes={enableState.backupCodes} />
            <p className="text-xs text-muted-foreground">
              {t("profile.twoFactor.backupCodesWarning")}
            </p>
          </div>
        </div>
      )}

      {twoFactorEnabled && enableState.step === "idle" && (
        <form onSubmit={disableForm.handleSubmit(handleDisable)} className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("profile.twoFactor.disablePrompt")}</p>
          <div className="space-y-2">
            <Label htmlFor="disable-password">{t("common.password")}</Label>
            <Input
              id="disable-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11"
              {...disableForm.register("password")}
              disabled={disableForm.formState.isSubmitting}
            />
            {disableForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {disableForm.formState.errors.password.message}
              </p>
            )}
          </div>
          {disableError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{disableError}</p>
            </div>
          )}
          {disableSuccess && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                {t("profile.twoFactor.disabled2fa")}
              </p>
            </div>
          )}
          <Button
            type="submit"
            variant="destructive"
            disabled={disableForm.formState.isSubmitting}
          >
            {disableForm.formState.isSubmitting
              ? t("profile.twoFactor.disabling")
              : t("profile.twoFactor.disable")}
          </Button>
        </form>
      )}
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
