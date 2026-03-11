import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { Route } from "./+types/new";
import i18n from "~/lib/i18n";
import { requireAdmin } from "~/lib/auth/server";
import { createUser } from "~/services/user.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const schema = z.object({
  name: z.string().min(1, i18n.t("validation.nameRequired")),
  email: z.string().email(i18n.t("validation.invalidEmail")),
  role: z.string().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const result = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { name, email, role } = result.data;
  await createUser(name, email, role ?? "user", request.headers);

  return redirect("/admin/users?created=true");
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: `${i18n.t("admin.newUser.title")} - ${i18n.t("admin.sidebar.appName")}` }];
}

export default function NewUser() {
  const { t } = useTranslation();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin/users">
            <ArrowLeft />
            {t("admin.newUser.backToUsers")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.newUser.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("admin.newUser.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
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
              defaultValue="user"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="user">{t("common.user")}</option>
              <option value="admin">{t("common.admin")}</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? t("admin.newUser.sendingInvite") : t("admin.newUser.sendInvite")}
            </Button>
            <Button asChild variant="outline" disabled={isSubmitting}>
              <Link to="/admin/users">{t("common.cancel")}</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
