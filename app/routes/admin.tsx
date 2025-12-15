import { type LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/admin";
import { requireAuth, getUser } from "../lib/auth.server";
import { AdminLayout } from "../components/admin-layout";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const user = await getUser(request);
  return { userEmail: user?.email };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Admin - Railcenter Datalake" }];
}

export default function Admin() {
  const { userEmail } = useLoaderData<typeof loader>();

  return (
    <AdminLayout userEmail={userEmail ?? undefined}>
      <Outlet />
    </AdminLayout>
  );
}

