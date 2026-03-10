import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.users.$id";
import { requireAuth, hashPassword } from "~/lib/auth.server";
import { logActivity } from "~/lib/activity-log.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/lib/db.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user, currentUserId: session.user.id };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const currentUserId = session.user.id;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    if (currentUserId === params.id) {
      return { errors: { delete: "You cannot delete your own account" } };
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      select: { email: true },
    });

    await prisma.user.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: currentUserId,
      action: "USER_DELETED",
      entityType: "USER",
      entityId: params.id,
      details: { email: userToDelete?.email },
      request,
    });

    return redirect("/admin/users?deleted=true");
  }

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

  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: params.id },
      },
    });

    if (existingUser) {
      errors.email = "A user with this email already exists";
    }
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

  await prisma.user.update({
    where: { id: params.id },
    data: { email, name },
  });

  if (password) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: params.id, providerId: "credential" },
      data: { password: hashedPassword },
    });
  }

  const details: Record<string, unknown> = { email, name };
  if (password) {
    details.passwordChanged = true;
  }

  await logActivity({
    userId: currentUserId,
    action: "USER_UPDATED",
    entityType: "USER",
    entityId: params.id,
    details,
    request,
  });

  return redirect("/admin/users?updated=true");
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Edit User - ${data?.user.email || 'User'} - Railcenter Datalake Admin` }];
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
      {/* Header */}
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

      {/* User Info */}
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

      {/* Edit Form */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <Form method="post" className="space-y-6">
          {/* Name Field */}
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

          {/* Email Field */}
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

          {/* Password Field */}
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

          {/* Confirm Password Field */}
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

          {/* Actions */}
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

      {/* Delete Section */}
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete a user, there is no going back. Please be certain.
        </p>
        {isSelf ? (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You cannot delete your own account. Please ask another administrator to delete your account if needed.
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
              if (!confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
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
