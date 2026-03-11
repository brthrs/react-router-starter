import type { Route } from "./+types/dashboard";
import { requireAuth } from "~/lib/auth/server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard - Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your admin panel</p>
      </div>
    </div>
  );
}
