import { type ActionFunctionArgs, redirect } from "react-router";
import { auth } from "~/lib/auth.server";
import { logActivity } from "~/lib/activity-log.server";

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session) {
    await logActivity({
      userId: session.user.id,
      action: "LOGOUT",
      request,
    });
  }

  const signOutResponse = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });

  const setCookie = signOutResponse.headers.get("Set-Cookie");
  const headers = new Headers();
  if (setCookie) {
    headers.set("Set-Cookie", setCookie);
  }

  return redirect("/login", { headers });
}

export async function loader() {
  return redirect("/");
}
