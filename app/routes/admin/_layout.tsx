import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/_layout";
import i18n from "~/lib/i18n";
import { requireAdmin } from "~/lib/auth/server";
import { AdminLayout } from "~/components/layouts/admin-layout";
import { RouteErrorBoundary } from "~/components/route-error-boundary";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAdmin(request);
  return { userEmail: session.user.email };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: `${i18n.t("admin.title")} - ${i18n.t("admin.sidebar.appName")}` }];
}

export default function Admin() {
  const { userEmail } = useLoaderData<typeof loader>();

  return (
    <AdminLayout userEmail={userEmail ?? undefined}>
      <Outlet />
    </AdminLayout>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
