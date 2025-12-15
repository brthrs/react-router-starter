import { type ActionFunctionArgs, redirect } from "react-router";
import { destroySessionCookie, getSessionFromCookie } from "../lib/auth.server";
import { logActivity } from "../lib/activity-log.server";

export async function action({ request }: ActionFunctionArgs) {
  // Get the user ID before destroying the session
  const cookieHeader = request.headers.get("Cookie");
  const userId = getSessionFromCookie(cookieHeader);

  // Log logout activity if user was logged in
  if (userId) {
    await logActivity({
      userId,
      action: "LOGOUT",
      request,
    });
  }

  const cookie = destroySessionCookie();
  
  return redirect("/login", {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}

export async function loader() {
  return redirect("/");
}




