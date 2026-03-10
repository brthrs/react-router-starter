import { Link, useSearchParams } from "react-router";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/admin.users";
import { requireAuth } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const ITEMS_PER_PAGE = 10;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where = searchQuery
    ? {
        email: {
          contains: searchQuery,
        },
      }
    : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    searchQuery,
  };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Users - Railcenter Datalake Admin" }];
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function Users({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { users, pagination, searchQuery } = loaderData as unknown as LoaderData;

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      toast.success("User created successfully");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("created");
      setSearchParams(newParams, { replace: true });
    } else if (searchParams.get("updated") === "true") {
      toast.success("User updated successfully");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("updated");
      setSearchParams(newParams, { replace: true });
    } else if (searchParams.get("deleted") === "true") {
      toast.success("User deleted successfully");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("deleted");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    
    const newParams = new URLSearchParams(searchParams);
    if (search) {
      newParams.set("search", search);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/users/new">
            <Plus />
            Add User
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Search by email..."
            defaultValue={searchQuery}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Users Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery ? "No users found matching your search" : "No users yet"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/users/${user.id}`}>
                          Edit
                        </Link>
                      </Button>
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
              {pagination.totalCount} users
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
