import { type LoaderFunctionArgs, Link, Form } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/index";
import i18n from "~/lib/i18n";
import { require2FASetup } from "~/lib/auth/server";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";
import { RouteErrorBoundary } from "~/components/route-error-boundary";

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("dashboard.title") }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await require2FASetup(request);
  return {
    user: {
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as string,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt,
    },
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Form method="post" action="/logout">
              <Button type="submit" variant="outline" size="sm">
                {t("common.signOut")}
              </Button>
            </Form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <h2 className="text-2xl font-semibold">{t("dashboard.welcome", { name: user.name })}</h2>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/profile"
            className="rounded-xl border bg-card shadow-sm p-6 hover:border-primary/50 transition-colors"
          >
            <h3 className="font-semibold">{t("dashboard.profileLink")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("dashboard.profileDescription")}
            </p>
          </Link>

          {user.role === "admin" && (
            <Link
              to="/admin"
              className="rounded-xl border bg-card shadow-sm p-6 hover:border-primary/50 transition-colors"
            >
              <h3 className="font-semibold">{t("dashboard.adminLink")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("dashboard.adminDescription")}
              </p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
