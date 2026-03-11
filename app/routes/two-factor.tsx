import { type LoaderFunctionArgs, redirect } from "react-router";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/two-factor";
import { auth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Two-Factor Authentication" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/profile");
  return {};
}

type Tab = "totp" | "otp" | "backup";

export default function TwoFactor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleRedirect = () => {
    navigate("/profile");
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: err } = await authClient.twoFactor.verifyTotp({ code });
    if (err) {
      setError(err.message ?? "Invalid code. Please try again.");
      setIsSubmitting(false);
    } else {
      handleRedirect();
    }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setError(null);
    const { error: err } = await authClient.twoFactor.sendOtp();
    if (err) {
      setError(err.message ?? "Failed to send code. Please try again.");
    } else {
      setOtpSent(true);
    }
    setIsSendingOtp(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: err } = await authClient.twoFactor.verifyOtp({ code });
    if (err) {
      setError(err.message ?? "Invalid code. Please try again.");
      setIsSubmitting(false);
    } else {
      handleRedirect();
    }
  };

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: err } = await authClient.twoFactor.verifyBackupCode({ code });
    if (err) {
      setError(err.message ?? "Invalid backup code. Please try again.");
      setIsSubmitting(false);
    } else {
      handleRedirect();
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "totp", label: t("auth.twoFactor.authenticatorApp") },
    { id: "otp", label: t("auth.twoFactor.emailCode") },
    { id: "backup", label: t("auth.twoFactor.backupCode") },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t("auth.twoFactor.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.twoFactor.subtitle")}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border">
          <div className="flex border-b">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setCode(""); setError(null); setOtpSent(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {tab === "totp" && (
              <form onSubmit={handleTotpSubmit} className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {t("auth.twoFactor.totpDescription")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="totp-code">{t("auth.twoFactor.authenticationCode")}</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    className="h-11 text-center tracking-widest text-lg"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full h-11" disabled={isSubmitting || code.length !== 6}>
                  {isSubmitting ? t("common.verifying") : t("common.verify")}
                </Button>
              </form>
            )}

            {tab === "otp" && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {t("auth.twoFactor.otpDescription")}
                </p>
                {!otpSent ? (
                  <>
                    {error && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                    <Button
                      type="button"
                      className="w-full h-11"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? t("common.sending") : t("auth.twoFactor.sendCodeToEmail")}
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp-code">{t("auth.twoFactor.emailCode")}</Label>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        className="h-11 text-center tracking-widest text-lg"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 h-11" disabled={isSubmitting || code.length !== 6}>
                        {isSubmitting ? t("common.verifying") : t("common.verify")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => { setOtpSent(false); setCode(""); setError(null); }}
                        disabled={isSubmitting}
                      >
                        {t("auth.twoFactor.resend")}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === "backup" && (
              <form onSubmit={handleBackupSubmit} className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {t("auth.twoFactor.backupDescription")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="backup-code">{t("auth.twoFactor.backupCode")}</Label>
                  <Input
                    id="backup-code"
                    type="text"
                    placeholder="xxxxxxxx"
                    className="h-11 font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full h-11" disabled={isSubmitting || !code.trim()}>
                  {isSubmitting ? t("common.verifying") : t("common.verify")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
