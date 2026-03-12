import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { ArrowLeft, Loader2, Mail, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { Route } from "./+types/$id";
import i18n from "~/lib/i18n";
import { requireAdmin } from "~/lib/auth/server";
import { getUserById, updateUser, deleteUser } from "~/services/user.server";
import { resendInvite } from "~/services/invite.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const schema = z.object({
  name: z.string().min(1, i18n.t("validation.nameRequired")),
  email: z.string().email(i18n.t("validation.invalidEmail")),
  role: z.string().optional(),
});

interface ActionErrors {
  name?: string[];
  email?: string[];
  role?: string[];
  delete?: string[];
  invite?: string[];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAdmin(request);
  const { user, hasPendingInvite } = await getUserById(params.id as string);

  return { user, currentUserId: session.user.id, hasPendingInvite };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const currentUserId = session.user.id;
  const userId = params.id as string;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    if (currentUserId === userId) {
      return { errors: { delete: [i18n.t("errors.cannotDeleteOwnAccount")] } as ActionErrors };
    }

    await deleteUser(userId, request.headers);

    return redirect("/admin/users?deleted=true");
  }

  if (intent === "resend-invite") {
    try {
      await resendInvite(userId);
    } catch {
      return { errors: { invite: [i18n.t("errors.userNotFound")] } as ActionErrors };
    }

    return { success: { invite: i18n.t("admin.editUser.inviteResent") } };
  }

  const result = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as ActionErrors };
  }

  const { name, email, role } = result.data;
  await updateUser(userId, { name, email, role: role ?? "user" }, request.headers);

  return redirect("/admin/users?updated=true");
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${i18n.t("admin.editUser.title")} - ${data?.user.email || i18n.t("common.user")} - ${i18n.t("admin.sidebar.appName")}` }];
}

export default function EditUser({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { user, currentUserId, hasPendingInvite } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isDeleting = isSubmitting && navigation.formData?.get("intent") === "delete";
  const isResending = isSubmitting && navigation.formData?.get("intent") === "resend-invite";
  const isSelf = currentUserId === user.id;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin/users">
            <ArrowLeft />
            {t("admin.editUser.backToUsers")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.editUser.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("admin.editUser.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="space-y-1 mb-6">
          <p className="text-sm text-muted-foreground">{t("admin.editUser.userId")}</p>
          <p className="font-mono text-sm">{user.id}</p>
        </div>
        <div className="space-y-1 mb-6">
          <p className="text-sm text-muted-foreground">{t("admin.editUser.created")}</p>
          <p className="text-sm">
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t("common.status")}</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              user.emailVerified
                ? "bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-400"
                : "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 dark:text-yellow-400"
            }`}
          >
            {user.emailVerified ? t("common.active") : t("common.invited")}
          </span>
        </div>
      </div>

      {hasPendingInvite && (
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">{t("admin.editUser.pendingInvite")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("admin.editUser.pendingInviteDescription")}
          </p>
          {actionData?.success?.invite && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 mb-4">
              <p className="text-sm text-green-700 dark:text-green-400">{actionData.success.invite}</p>
            </div>
          )}
          {actionData?.errors?.invite && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 mb-4">
              <p className="text-sm text-destructive">{actionData.errors.invite[0]}</p>
            </div>
          )}
          <Form method="post">
            <input type="hidden" name="intent" value="resend-invite" />
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              {isResending ? <Loader2 className="animate-spin" /> : <Mail />}
              {isResending ? t("admin.editUser.resending") : t("admin.editUser.resendInvite")}
            </Button>
          </Form>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              placeholder={t("common.namePlaceholder")}
              required
              aria-invalid={actionData?.errors?.name ? true : undefined}
            />
            {actionData?.errors?.name && (
              <p className="text-sm text-destructive">{actionData.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder={t("common.emailPlaceholder")}
              required
              aria-invalid={actionData?.errors?.email ? true : undefined}
            />
            {actionData?.errors?.email && (
              <p className="text-sm text-destructive">{actionData.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t("common.role")}</Label>
            <select
              id="role"
              name="role"
              defaultValue={user.role ?? "user"}
              disabled={isSelf}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="user">{t("common.user")}</option>
              <option value="admin">{t("common.admin")}</option>
            </select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">{t("admin.editUser.cannotChangeOwnRole")}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && !isDeleting && !isResending && <Loader2 className="animate-spin" />}
              {isSubmitting && !isDeleting && !isResending ? t("common.saving") : t("common.save")}
            </Button>
            <Button asChild variant="outline" disabled={isSubmitting}>
              <Link to="/admin/users">{t("common.cancel")}</Link>
            </Button>
          </div>
        </Form>
      </div>

      <div className="rounded-xl border border-destructive/50 bg-destructive/5 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">{t("admin.editUser.dangerZone")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("admin.editUser.deleteWarning")}
        </p>
        {isSelf ? (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {t("admin.editUser.cannotDeleteSelf")}
            </p>
          </div>
        ) : null}
        {actionData?.errors?.delete && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
            <p className="text-sm text-destructive">{actionData.errors.delete[0]}</p>
          </div>
        )}
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button
            type="submit"
            variant="destructive"
            disabled={isSubmitting || isSelf}
            onClick={(e) => {
              if (
                !confirm(
                  t("admin.editUser.confirmDelete", { email: user.email })
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {isDeleting && <Loader2 className="animate-spin" />}
            <Trash2 />
            {isDeleting ? t("common.deleting") : t("admin.editUser.deleteUser")}
          </Button>
        </Form>
      </div>
    </div>
  );
}
