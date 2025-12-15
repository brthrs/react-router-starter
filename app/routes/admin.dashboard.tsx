import type { Route } from "./+types/admin.dashboard";
import { prisma } from "~/lib/db.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard - Admin" }];
}

export async function loader() {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get stats
  const [
    totalUsers,
    newUsersLast7Days,
    totalActivitiesLast24Hours,
    totalActivitiesLast30Days,
    recentActivities,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // New users in last 7 days
    prisma.user.count({
      where: {
        createdAt: {
          gte: last7Days,
        },
      },
    }),
    
    // Activities in last 24 hours
    prisma.activityLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    
    // Activities in last 30 days for comparison
    prisma.activityLog.count({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
    }),
    
    // Recent activity logs
    prisma.activityLog.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      totalUsers,
      newUsersLast7Days,
      totalActivitiesLast24Hours,
      totalActivitiesLast30Days,
    },
    recentActivities,
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { stats, recentActivities } = loaderData;
  const statsCards = [
    { 
      name: "Total Users", 
      value: stats.totalUsers.toString(),
      subtext: `${stats.newUsersLast7Days} new in last 7 days`
    },
    { 
      name: "New Users (7d)", 
      value: stats.newUsersLast7Days.toString(),
      subtext: "new users this week"
    },
    { 
      name: "Recent Activity", 
      value: stats.totalActivitiesLast24Hours.toString(),
      subtext: "actions in last 24 hours"
    },
    { 
      name: "Total Activities", 
      value: stats.totalActivitiesLast30Days.toString(),
      subtext: "in last 30 days"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
            <div className="mt-2">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              {stat.subtext && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtext}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y">
          {recentActivities.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 px-6 py-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {formatAction(activity.action)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user.email}
                    {activity.entityType && ` • ${activity.entityType}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${diffInDays}d ago`;
  }
}

