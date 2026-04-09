import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, LinkIcon, ClockIcon, CheckCircleIcon } from "lucide-react";
import { z } from "zod";
import type { Route } from "./+types/accept-invite";
import i18n from "~/lib/i18n";
import { auth } from "~/lib/auth/server";
import { getInviteStatus, acceptInvite } from "~/services/invite.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, i18n.t("validation.passwordMin8")).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t("validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

interface ActionErrors {
  token?: string[];
  password?: string[];
  confirmPassword?: string[];
  form?: string[];
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: `${i18n.t("auth.acceptInvite.title")} - ${i18n.t("admin.sidebar.appName")}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { status: "not_found" as const };
  }

  const signedOut = url.searchParams.get("_so") === "1";
  const session = await auth.api.getSession({ headers: request.headers });
  if (session && !signedOut) {
    const signOutResponse = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });
    const setCookie = signOutResponse.headers.get("Set-Cookie");
    const headers = new Headers();
    if (setCookie) headers.set("Set-Cookie", setCookie);
    throw redirect(`/accept-invite?token=${token}&_so=1`, { headers });
  }

  const result = await getInviteStatus(token);

  if (result.status !== "valid") {
    return { status: result.status };
  }

  return { status: "valid" as const, name: result.name, email: result.email, token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as ActionErrors };
  }

  const { token, password } = result.data;

  const inviteStatus = await getInviteStatus(token);
  if (inviteStatus.status !== "valid") {
    return { errors: { form: [i18n.t("errors.inviteNoLongerValid")] } as ActionErrors };
  }

  try {
    await acceptInvite(token, password);
  } catch {
    return { errors: { form: [i18n.t("errors.somethingWentWrongRetry")] } as ActionErrors };
  }

  return redirect("/login?invited=true");
}

function InvalidInvitePage({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Link
          to="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {t("auth.acceptInvite.signInToAccount")}
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  const { t } = useTranslation();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (loaderData.status === "already_accepted") {
    return (
      <InvalidInvitePage
        icon={CheckCircleIcon}
        title={t("auth.acceptInvite.alreadyAccepted")}
        description={t("auth.acceptInvite.alreadyAcceptedDescription")}
      />
    );
  }

  if (loaderData.status === "expired" || loaderData.status === "not_found") {
    return (
      <InvalidInvitePage
        icon={loaderData.status === "expired" ? ClockIcon : LinkIcon}
        title={t("auth.acceptInvite.invalidLink")}
        description={t("auth.acceptInvite.invalidLinkDescription")}
      />
    );
  }

  const { name, email, token } = loaderData;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t("auth.acceptInvite.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.acceptInvite.subtitle", { name })}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-8">
          {actionData?.errors?.form && (
            <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{actionData.errors.form[0]}</p>
            </div>
          )}

          <Form method="post" className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("common.name")}</label>
              <Input value={name} disabled className="h-11 opacity-60" readOnly />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("common.email")}</label>
              <Input value={email} disabled className="h-11 opacity-60" readOnly />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {t("common.password")}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("common.passwordPlaceholder")}
                required
                minLength={8}
                className="h-11"
                disabled={isSubmitting}
                aria-invalid={actionData?.errors?.password ? true : undefined}
              />
              {actionData?.errors?.password && (
                <p className="text-sm text-destructive">{actionData.errors.password[0]}</p>
              )}
              <p className="text-sm text-muted-foreground">{t("auth.acceptInvite.passwordHint")}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                {t("common.confirmPassword")}
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t("common.passwordPlaceholder")}
                required
                minLength={8}
                className="h-11"
                disabled={isSubmitting}
                aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
              />
              {actionData?.errors?.confirmPassword && (
                <p className="text-sm text-destructive">{actionData.errors.confirmPassword[0]}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? t("auth.acceptInvite.activating") : t("auth.acceptInvite.activateAccount")}
            </Button>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("common.hasAccount")}{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
