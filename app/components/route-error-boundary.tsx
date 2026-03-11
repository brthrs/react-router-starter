import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Button } from "~/components/ui/button";

export function RouteErrorBoundary() {
  const error = useRouteError();

  let status = 500;
  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again later.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    switch (error.status) {
      case 403:
        title = "Access denied";
        description = "You don't have permission to view this page.";
        break;
      case 404:
        title = "Page not found";
        description = "The page you're looking for doesn't exist or has been moved.";
        break;
      default:
        title = `Error ${error.status}`;
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
            Go back
          </Button>
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
