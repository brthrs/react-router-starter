import { type LoaderFunctionArgs, Link, Form } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/profile";
import i18n from "~/lib/i18n";
import { requireAuth } from "~/lib/auth/server";
import { getFileUrl } from "~/lib/storage.server";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";
import { RouteErrorBoundary } from "~/components/route-error-boundary";
import { AccountInfo } from "~/components/profile/account-info";
import { ChangePassword } from "~/components/profile/change-password";
import { TwoFactorSection } from "~/components/profile/two-factor-section";
import { DeleteAccount } from "~/components/profile/delete-account";

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("profile.title") }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);
  const imageKey = session.user.image as string | null;
  const imageUrl = imageKey ? await getFileUrl(imageKey) : null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as string,
      imageUrl,
      twoFactorEnabled:
        (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false,
    },
  };
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t("profile.title")}</h1>
          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                {t("common.admin")}
              </Link>
            )}
            <ThemeToggle />
            <Form method="post" action="/logout">
              <Button type="submit" variant="outline" size="sm">
                {t("common.signOut")}
              </Button>
            </Form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <AccountInfo user={user} />
        <ChangePassword />
        <TwoFactorSection initialEnabled={user.twoFactorEnabled} />
        <DeleteAccount userEmail={user.email} />
      </main>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
