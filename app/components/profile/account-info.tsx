import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";

interface AccountInfoProps {
  user: {
    name: string;
    email: string;
    role: string;
    imageUrl: string | null;
  };
}

export function AccountInfo({ user }: AccountInfoProps) {
  const { t } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState(user.imageUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      if (res.ok) {
        setAvatarUrl(URL.createObjectURL(file));
      }
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user.role === "admin" ? t("common.admin") : t("common.user");
  const roleBadgeClass =
    user.role === "admin"
      ? "bg-primary/10 text-primary border border-primary/20"
      : "bg-muted text-muted-foreground border border-border";

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold">{t("profile.account")}</h2>
      <div className="flex items-start gap-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarUploading}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden ring-2 ring-border hover:ring-primary transition-all"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-muted-foreground">{initials}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </button>
        <div className="grid gap-4 sm:grid-cols-2 flex-1">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("common.name")}</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("common.email")}</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("common.role")}</p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass}`}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
