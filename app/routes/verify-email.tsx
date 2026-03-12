import { type LoaderFunctionArgs, redirect } from "react-router";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/verify-email";
import i18n from "~/lib/i18n";
import { auth } from "~/lib/auth/server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: i18n.t("auth.verifyEmail.title") }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { success: false, errorKey: "auth.verifyEmail.missingToken" };
  }

  try {
    await auth.api.verifyEmail({ query: { token } });
    throw redirect("/login?verified=true");
  } catch (err) {
    if (err instanceof Response) throw err;
    return { success: false, errorKey: "auth.verifyEmail.invalidLink" };
  }
}

export default function VerifyEmail({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { errorKey } = loaderData as { success: boolean; errorKey?: string };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("auth.verifyEmail.title")}</h1>
        <p className="text-muted-foreground">{errorKey ? t(errorKey) : null}</p>
        <Link
          to="/login"
          className="inline-block text-sm font-medium text-foreground underline underline-offset-4"
        >
          {t("common.backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
