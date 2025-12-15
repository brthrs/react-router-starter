import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from "react-router";
import { Form, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { validateCredentials, createSessionCookie, getSessionFromCookie } from "../lib/auth.server";
import { logActivity } from "../lib/activity-log.server";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Login - Railcenter Datalake Admin" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = getSessionFromCookie(cookieHeader);
  
  // If already logged in, redirect to admin
  if (session) {
    throw redirect("/admin");
  }
  
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return data(
      { error: "Invalid form submission" },
      { status: 400 }
    );
  }

  const userId = await validateCredentials(email, password);

  if (!userId) {
    return data(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Log the login activity
  await logActivity({
    userId,
    action: "LOGIN",
    request,
  });

  // Create session cookie with user ID
  const cookie = createSessionCookie(userId);

  return redirect("/admin", {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Railcenter Datalake Admin</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your account
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          <Form method="post" className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                className="h-11"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="h-11"
                disabled={isSubmitting}
              />
            </div>

            {actionData?.error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{actionData.error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Your session will never expire
        </p>
      </div>
    </div>
  );
}
