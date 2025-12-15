import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "./+types/admin.activity";
import { requireAuth } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { Button } from "~/components/ui/button";

const ITEMS_PER_PAGE = 25;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.activityLog.count(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    logs,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Activity Log - Railcenter Datalake Admin" }];
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function ActivityLog({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { logs, pagination } = loaderData as unknown as LoaderData;

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  const getActionBadgeColor = (action: string) => {
    // Generate a consistent color based on the action string
    const hash = action.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatAction = (action: string) => {
    return action.split("_").map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(" ");
  };

  const formatDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="text-muted-foreground">{key}:</span>{" "}
          <span className="text-foreground">{String(value)}</span>
        </div>
      ));
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          View all admin actions and system activities
        </p>
      </div>

      {/* Activity Log Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No activity logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {log.entityType ? (
                          <>
                            <div>{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-xs font-mono">{log.entityId}</div>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {log.details ? formatDetails(log.details) : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground font-mono">
                        {log.ipAddress || "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(pagination.currentPage * ITEMS_PER_PAGE, pagination.totalCount)} of{" "}
              {pagination.totalCount} activities
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                <ChevronLeft />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

