import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/_layout";
import { requireAdmin } from "~/lib/auth/server";
import { AdminLayout } from "~/components/layouts/admin-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAdmin(request);
  return { userEmail: session.user.email };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Admin - React Router Starter" }];
}

export default function Admin() {
  const { userEmail } = useLoaderData<typeof loader>();

  return (
    <AdminLayout userEmail={userEmail ?? undefined}>
      <Outlet />
    </AdminLayout>
  );
}
