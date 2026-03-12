import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "~/lib/auth/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface DeleteAccountProps {
  userEmail: string;
}

export function DeleteAccount({ userEmail }: DeleteAccountProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const { error: err } = await authClient.deleteUser();
      if (err) {
        setError(err.message ?? t("errors.failedToDeleteAccount"));
        setIsDeleting(false);
        return;
      }
      window.location.href = "/login?deleted=true";
    } catch {
      setError(t("errors.failedToDeleteAccount"));
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/5 shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold">{t("profile.dangerZone.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("profile.dangerZone.description")}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">{t("profile.dangerZone.deleteAccount")}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.dangerZone.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("profile.dangerZone.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm-email">{t("profile.dangerZone.typeEmail")}</Label>
              <Input
                id="delete-confirm-email"
                type="email"
                placeholder={userEmail}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                disabled={isDeleting}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button
              variant="destructive"
              className="w-full"
              disabled={confirmEmail !== userEmail || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? t("common.deleting") : t("profile.dangerZone.confirmDelete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
