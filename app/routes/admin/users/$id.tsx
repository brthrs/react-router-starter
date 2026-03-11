import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import type { Route } from "./+types/$id";
import { requireAdmin, auth } from "~/lib/auth/server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAdmin(request);

  const user = await auth.api.getUser({
    query: { id: params.id as string },
    headers: request.headers,
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user, currentUserId: session.user.id };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);
  const currentUserId = session.user.id;
  const userId = params.id as string;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    if (currentUserId === userId) {
      return { errors: { delete: "You cannot delete your own account" } };
    }

    await auth.api.removeUser({
      body: { userId },
      headers: request.headers,
    });

    return redirect("/admin/users?deleted=true");
  }

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const errors: Record<string, string> = {};

  if (!email || !email.includes("@")) {
    errors.email = "Please enter a valid email address";
  }

  if (!name || name.trim().length === 0) {
    errors.name = "Please enter a name";
  }

  if (password || confirmPassword) {
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const validRole = role === "admin" || role === "user" ? role : "user";

  await auth.api.adminUpdateUser({
    body: { userId, data: { name, email } },
    headers: request.headers,
  });

  await auth.api.setRole({
    body: { userId, role: validRole },
    headers: request.headers,
  });

  if (password) {
    await auth.api.setUserPassword({
      body: { userId, newPassword: password },
      headers: request.headers,
    });
  }

  return redirect("/admin/users?updated=true");
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Edit User - ${data?.user.email || "User"} - React Router Starter` }];
}

export default function EditUser({ loaderData }: Route.ComponentProps) {
  const { user, currentUserId } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isDeleting = isSubmitting && navigation.formData?.get("intent") === "delete";
  const isSelf = currentUserId === user.id;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin/users">
            <ArrowLeft />
            Back to Users
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit User</h1>
        <p className="text-muted-foreground mt-1">
          Update user account details
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="space-y-1 mb-6">
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="font-mono text-sm">{user.id}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="text-sm">
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              placeholder="John Doe"
              required
              aria-invalid={actionData?.errors?.name ? true : undefined}
            />
            {actionData?.errors?.name && (
              <p className="text-sm text-destructive">{actionData.errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder="user@example.com"
              required
              aria-invalid={actionData?.errors?.email ? true : undefined}
            />
            {actionData?.errors?.email && (
              <p className="text-sm text-destructive">{actionData.errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={user.role ?? "user"}
              disabled={isSelf}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password (optional)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={8}
              aria-invalid={actionData?.errors?.password ? true : undefined}
            />
            {actionData?.errors?.password && (
              <p className="text-sm text-destructive">{actionData.errors.password}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Leave blank to keep current password
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              minLength={8}
              aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
            />
            {actionData?.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{actionData.errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && !isDeleting && <Loader2 className="animate-spin" />}
              {isSubmitting && !isDeleting ? "Saving..." : "Save Changes"}
            </Button>
            <Button asChild variant="outline" disabled={isSubmitting}>
              <Link to="/admin/users">Cancel</Link>
            </Button>
          </div>
        </Form>
      </div>

      <div className="rounded-xl border border-destructive/50 bg-destructive/5 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete a user, there is no going back. Please be certain.
        </p>
        {isSelf ? (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You cannot delete your own account. Please ask another administrator to delete your
              account if needed.
            </p>
          </div>
        ) : null}
        {actionData?.errors?.delete && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
            <p className="text-sm text-destructive">{actionData.errors.delete}</p>
          </div>
        )}
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button
            type="submit"
            variant="destructive"
            disabled={isSubmitting || isSelf}
            onClick={(e) => {
              if (
                !confirm(
                  `Are you sure you want to delete ${user.email}? This action cannot be undone.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {isDeleting && <Loader2 className="animate-spin" />}
            <Trash2 />
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </Form>
      </div>
    </div>
  );
}
