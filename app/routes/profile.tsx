import { type LoaderFunctionArgs, Link, Form } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Route } from "./+types/profile";
import { requireAuth } from "~/lib/auth/server";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Profile" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as string,
      twoFactorEnabled: (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false,
    },
  };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

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

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [enable2faState, setEnable2faState] = useState<Enable2faState>({ step: "idle" });
  const [enable2faError, setEnable2faError] = useState<string | null>(null);

  const [disable2faError, setDisable2faError] = useState<string | null>(null);
  const [disable2faSuccess, setDisable2faSuccess] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled);

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });
  const enable2faForm = useForm<Enable2faValues>({ resolver: zodResolver(enable2faSchema) });
  const verify2faForm = useForm<Verify2faValues>({ resolver: zodResolver(verify2faSchema) });
  const disable2faForm = useForm<Disable2faValues>({ resolver: zodResolver(disable2faSchema) });

  const handlePasswordChange = async (values: PasswordValues) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: false,
    });
    if (error) {
      setPasswordError(error.message ?? "Failed to update password.");
    } else {
      setPasswordSuccess(true);
      passwordForm.reset();
    }
  };

  const handleEnable2fa = async (values: Enable2faValues) => {
    setEnable2faError(null);
    const { data, error } = await authClient.twoFactor.enable({ password: values.password });
    if (error || !data) {
      setEnable2faError(error?.message ?? "Failed to enable 2FA.");
      return;
    }
    setEnable2faState({
      step: "qr",
      totpURI: data.totpURI,
      backupCodes: data.backupCodes,
    });
  };

  const handleVerify2fa = async (values: Verify2faValues) => {
    setEnable2faError(null);
    const { error } = await authClient.twoFactor.verifyTotp({ code: values.code });
    if (error) {
      setEnable2faError(error.message ?? "Invalid code. Please try again.");
      return;
    }
    if (enable2faState.step === "qr") {
      setTwoFactorEnabled(true);
      setEnable2faState({ step: "done", backupCodes: enable2faState.backupCodes });
    }
  };

  const handleDisable2fa = async (values: Disable2faValues) => {
    setDisable2faError(null);
    setDisable2faSuccess(false);
    const { error } = await authClient.twoFactor.disable({ password: values.password });
    if (error) {
      setDisable2faError(error.message ?? "Failed to disable 2FA.");
      return;
    }
    setTwoFactorEnabled(false);
    setDisable2faSuccess(true);
    disable2faForm.reset();
  };

  const roleLabel = user.role === "admin" ? "Admin" : "User";
  const roleBadgeClass =
    user.role === "admin"
      ? "bg-primary/10 text-primary border border-primary/20"
      : "bg-muted text-muted-foreground border border-border";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="flex items-center gap-4">
            {user.role === "admin" && (
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            )}
            <Form method="post" action="/logout">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </Form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Account info */}
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Role</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11"
                {...passwordForm.register("currentPassword")}
                aria-invalid={passwordForm.formState.errors.currentPassword ? true : undefined}
                disabled={passwordForm.formState.isSubmitting}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11"
                {...passwordForm.register("newPassword")}
                aria-invalid={passwordForm.formState.errors.newPassword ? true : undefined}
                disabled={passwordForm.formState.isSubmitting}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
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
                {...passwordForm.register("confirmPassword")}
                aria-invalid={passwordForm.formState.errors.confirmPassword ? true : undefined}
                disabled={passwordForm.formState.isSubmitting}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            {passwordError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
                <p className="text-sm text-green-700 dark:text-green-400">Password updated successfully.</p>
              </div>
            )}
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>

        {/* Two-factor authentication */}
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security to your account.
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                twoFactorEnabled
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {!twoFactorEnabled && enable2faState.step === "idle" && (
            <form onSubmit={enable2faForm.handleSubmit(handleEnable2fa)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your password to begin setting up 2FA.
              </p>
              <div className="space-y-2">
                <Label htmlFor="enable-password">Password</Label>
                <Input
                  id="enable-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11"
                  {...enable2faForm.register("password")}
                  disabled={enable2faForm.formState.isSubmitting}
                />
                {enable2faForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{enable2faForm.formState.errors.password.message}</p>
                )}
              </div>
              {enable2faError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{enable2faError}</p>
                </div>
              )}
              <Button type="submit" disabled={enable2faForm.formState.isSubmitting}>
                {enable2faForm.formState.isSubmitting ? "Loading..." : "Set up 2FA"}
              </Button>
            </form>
          )}

          {enable2faState.step === "qr" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">Step 1 — Scan this QR code with your authenticator app</p>
                <div className="flex justify-center p-4 bg-white rounded-lg w-fit">
                  <QRCodeSVG value={enable2faState.totpURI} size={180} />
                </div>
                <p className="text-xs text-muted-foreground break-all font-mono">
                  {enable2faState.totpURI}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Step 2 — Save these backup codes</p>
                <div className="rounded-lg border bg-muted/50 p-4 grid grid-cols-2 gap-2">
                  {enable2faState.backupCodes.map((c) => (
                    <code key={c} className="text-xs font-mono text-foreground">{c}</code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Store these somewhere safe. Each code can only be used once.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Step 3 — Verify with a code from your app</p>
                <form onSubmit={verify2faForm.handleSubmit(handleVerify2fa)} className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    className="h-11 w-40 text-center tracking-widest text-lg"
                    {...verify2faForm.register("code")}
                    disabled={verify2faForm.formState.isSubmitting}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    className="h-11"
                    disabled={verify2faForm.formState.isSubmitting}
                  >
                    {verify2faForm.formState.isSubmitting ? "Verifying..." : "Verify & activate"}
                  </Button>
                </form>
                {(verify2faForm.formState.errors.code || enable2faError) && (
                  <p className="text-sm text-destructive">
                    {verify2faForm.formState.errors.code?.message ?? enable2faError}
                  </p>
                )}
              </div>
            </div>
          )}

          {enable2faState.step === "done" && (
            <div className="space-y-4">
              <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Two-factor authentication is now active on your account.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Your backup codes</p>
                <div className="rounded-lg border bg-muted/50 p-4 grid grid-cols-2 gap-2">
                  {enable2faState.backupCodes.map((c) => (
                    <code key={c} className="text-xs font-mono text-foreground">{c}</code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Store these somewhere safe. You won't be able to see them again.
                </p>
              </div>
            </div>
          )}

          {twoFactorEnabled && enable2faState.step === "idle" && (
            <form onSubmit={disable2faForm.handleSubmit(handleDisable2fa)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your password to disable two-factor authentication.
              </p>
              <div className="space-y-2">
                <Label htmlFor="disable-password">Password</Label>
                <Input
                  id="disable-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11"
                  {...disable2faForm.register("password")}
                  disabled={disable2faForm.formState.isSubmitting}
                />
                {disable2faForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{disable2faForm.formState.errors.password.message}</p>
                )}
              </div>
              {disable2faError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{disable2faError}</p>
                </div>
              )}
              {disable2faSuccess && (
                <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">
                  <p className="text-sm text-green-700 dark:text-green-400">2FA has been disabled.</p>
                </div>
              )}
              <Button type="submit" variant="destructive" disabled={disable2faForm.formState.isSubmitting}>
                {disable2faForm.formState.isSubmitting ? "Disabling..." : "Disable 2FA"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
