import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";

export function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();

  let status = 500;
  let title = t("errors.somethingWentWrong");
  let description = t("errors.unexpectedError");

  if (isRouteErrorResponse(error)) {
    status = error.status;
    switch (error.status) {
      case 403:
        title = t("errors.accessDenied");
        description = t("errors.accessDeniedDescription");
        break;
      case 404:
        title = t("errors.pageNotFound");
        description = t("errors.pageNotFoundDescription");
        break;
      default:
        title = t("errors.errorStatus", { status: error.status });
        description = error.statusText || description;
    }
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="text-6xl font-bold text-muted-foreground/30">{status}</div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            {t("common.back")}
          </Button>
          <Button asChild>
            <Link to="/">{t("common.home")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
