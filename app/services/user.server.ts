import { randomUUID } from "crypto";
import { auth } from "~/lib/auth/server";
import { prisma } from "~/lib/db.server";
import { createInvite } from "~/services/invite.server";

const ITEMS_PER_PAGE = 10;

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const pendingInvite = await prisma.invite.findFirst({
    where: { userId: user.id, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return { user, hasPendingInvite: !!pendingInvite };
}

export async function listUsers(page: number, search: string, headers: Headers) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const result = await auth.api.listUsers({
    query: {
      searchValue: search || undefined,
      searchField: "email",
      searchOperator: "contains",
      limit: ITEMS_PER_PAGE,
      offset,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    headers,
  });

  const totalCount = result.total;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    users: result.users,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function createUser(
  name: string,
  email: string,
  role: string,
  headers: Headers
) {
  const validRole = role === "admin" || role === "user" ? role : "user";

  await auth.api.createUser({
    body: { email, password: randomUUID(), name, role: validRole },
    headers,
  });

  const user = await prisma.user.findUnique({ where: { email } });

  await createInvite(user?.id ?? null, email, name, validRole);
}

export async function updateUser(
  userId: string,
  data: { name: string; email: string; role: string },
  headers: Headers
) {
  const validRole = data.role === "admin" || data.role === "user" ? data.role : "user";

  await auth.api.adminUpdateUser({
    body: { userId, data: { name: data.name, email: data.email } },
    headers,
  });

  await auth.api.setRole({
    body: { userId, role: validRole },
    headers,
  });
}

export async function deleteUser(userId: string, headers: Headers) {
  await auth.api.removeUser({
    body: { userId },
    headers,
  });
}
