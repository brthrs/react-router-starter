import { redirect } from "react-router";
import bcrypt from "bcryptjs";
import { prisma } from "./db.server";

const SESSION_COOKIE_NAME = "session";

export function createSessionCookie(userId: string): string {
  // Never-expiring cookie (set to 10 years)
  const maxAge = 10 * 365 * 24 * 60 * 60;
  return `${SESSION_COOKIE_NAME}=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  
  if (!sessionCookie) return null;
  
  return sessionCookie.split("=")[1];
}

export function destroySessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function validateCredentials(email: string, password: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return null;
  }

  return user.id;
}

export async function requireAuth(request: Request): Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  const userId = getSessionFromCookie(cookieHeader);
  
  if (!userId) {
    throw redirect("/login");
  }

  // Verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw redirect("/login");
  }

  return userId;
}

export async function getUser(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const userId = getSessionFromCookie(cookieHeader);
  
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });
}

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
