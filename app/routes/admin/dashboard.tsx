import { useTranslation } from "react-i18next";
import type { Route } from "./+types/dashboard";
import i18n from "~/lib/i18n";
import { requireAuth } from "~/lib/auth/server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: `${i18n.t("admin.dashboard.title")} - ${i18n.t("admin.title")}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.dashboard.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.dashboard.subtitle")}</p>
      </div>
    </div>
  );
}
