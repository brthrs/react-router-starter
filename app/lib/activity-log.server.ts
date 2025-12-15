import { prisma } from "./db.server";

interface LogActivityParams {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  request: Request;
}

/**
 * Log an activity performed by a user
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
  request,
}: LogActivityParams): Promise<void> {
  const ipAddress = getIpAddress(request);
  const userAgent = request.headers.get("User-Agent") || undefined;

  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get IP address from request
 */
function getIpAddress(request: Request): string | undefined {
  // Try common headers for proxied requests
  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("X-Real-IP");
  if (realIp) {
    return realIp;
  }

  // Note: In serverless environments, we might not have access to the actual IP
  return undefined;
}

