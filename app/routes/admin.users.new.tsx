import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Route } from "./+types/admin.users.new";
import { requireAuth, auth } from "~/lib/auth.server";
import { logActivity } from "~/lib/activity-log.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const errors: Record<string, string> = {};

  if (!email || !email.includes("@")) {
    errors.email = "Please enter a valid email address";
  }

  if (!name || name.trim().length === 0) {
    errors.name = "Please enter a name";
  }

  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      errors.email = "A user with this email already exists";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const newUser = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await logActivity({
    userId: session.user.id,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: newUser.user.id,
    details: { email },
    request,
  });

  return redirect("/admin/users?created=true");
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Add User - Railcenter Datalake Admin" }];
}

export default function NewUser() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin/users">
            <ArrowLeft />
            Back to Users
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Add User</h1>
        <p className="text-muted-foreground mt-1">
          Create a new user account
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <Form method="post" className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              aria-invalid={actionData?.errors?.name ? true : undefined}
            />
            {actionData?.errors?.name && (
              <p className="text-sm text-destructive">{actionData.errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
              aria-invalid={actionData?.errors?.email ? true : undefined}
            />
            {actionData?.errors?.email && (
              <p className="text-sm text-destructive">{actionData.errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              aria-invalid={actionData?.errors?.password ? true : undefined}
            />
            {actionData?.errors?.password && (
              <p className="text-sm text-destructive">{actionData.errors.password}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
            />
            {actionData?.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{actionData.errors.confirmPassword}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
            <Button asChild variant="outline" disabled={isSubmitting}>
              <Link to="/admin/users">Cancel</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
