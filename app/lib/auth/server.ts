import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor } from "better-auth/plugins";
import { redirect } from "react-router";
import bcrypt from "bcryptjs";
import { prisma } from "../db.server";
import { sendEmail } from "../email.server";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password) => bcrypt.hash(password, 10),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
        html: `<p>Click the link to reset your password:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
        html: `<p>Click the link to verify your email address:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    admin(),
    twoFactor({
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          sendEmail({
            to: user.email,
            subject: "Your two-factor authentication code",
            text: `Your 2FA code is: ${otp}. It expires in 10 minutes.`,
            html: `<p>Your 2FA code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
          });
        },
      },
    }),
  ],
});

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  return session;
}

export async function requireAdmin(request: Request) {
  const session = await requireAuth(request);

  if (session.user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}

export async function getUser(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session?.user ?? null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
