import type { Route } from "./+types/hello";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name") ?? "world";

  return Response.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();

  return Response.json({
    received: body,
    timestamp: new Date().toISOString(),
  });
}
