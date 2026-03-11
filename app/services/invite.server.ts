import { randomBytes } from "crypto";
import { prisma } from "~/lib/db.server";
import { hashPassword } from "~/lib/auth/server";
import { sendEmail } from "~/lib/email.server";
import { logger } from "~/lib/logger.server";

const log = logger.child({ module: "invite" });

export async function createInvite(
  userId: string | null,
  email: string,
  name: string,
  role: string
) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.invite.create({
    data: { email, name, role, token, userId, expiresAt },
  });

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:5173";
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    log.info({ email, inviteUrl }, "Invite URL generated (dev mode)");
  } else {
    sendEmail({
      to: email,
      subject: "You've been invited",
      text: `You've been invited to join. Click the link to set up your account: ${inviteUrl}`,
      html: `<p>You've been invited to join. Click the link to set up your account:</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>This link expires in 7 days.</p>`,
    });
  }
}

export async function validateInviteToken(token: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite) {
    throw new Response("Invite not found", { status: 404 });
  }

  if (invite.acceptedAt) {
    throw new Response("This invite has already been used", { status: 410 });
  }

  if (invite.expiresAt < new Date()) {
    throw new Response("This invite has expired", { status: 410 });
  }

  return invite;
}

export async function resendInvite(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.invite.updateMany({
    where: { userId, acceptedAt: null },
    data: { expiresAt: new Date(0) },
  });

  await createInvite(userId, user.email, user.name, user.role ?? "user");
}

export async function acceptInvite(token: string, password: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error("This invite is no longer valid");
  }

  const hashed = await hashPassword(password);

  await prisma.account.updateMany({
    where: { userId: invite.userId ?? "", providerId: "credential" },
    data: { password: hashed },
  });

  await prisma.user.update({
    where: { id: invite.userId ?? "" },
    data: { emailVerified: true },
  });

  await prisma.invite.update({
    where: { token },
    data: { acceptedAt: new Date() },
  });
}
