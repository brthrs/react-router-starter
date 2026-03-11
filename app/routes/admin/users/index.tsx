import { Link, useSearchParams } from "react-router";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Route } from "./+types/index";
import { requireAdmin } from "~/lib/auth/server";
import { listUsers } from "~/services/user.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const ITEMS_PER_PAGE = 10;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const { users, pagination } = await listUsers(page, searchQuery, request.headers);

  return { users, pagination, searchQuery };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Users - React Router Starter" }];
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function Users({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.users.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.users.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/users/new">
            <Plus />
            {t("admin.newUser.title")}
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder={t("admin.users.searchPlaceholder")}
            defaultValue={searchQuery}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          {t("common.search")}
        </Button>
      </form>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  {t("common.email")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  {t("common.name")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  {t("common.role")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  {t("common.status")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  {t("common.createdAt")}
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-foreground">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery ? t("admin.users.noUsersFound") : t("admin.users.noUsersYet")}
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
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {user.role === "admin" ? t("common.admin") : t("common.user")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.emailVerified
                            ? "bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-400"
                            : "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 dark:text-yellow-400"
                        }`}
                      >
                        {user.emailVerified ? t("common.active") : t("common.invited")}
                      </span>
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
                        <Link to={`/admin/users/${user.id}`}>{t("common.edit")}</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <div className="text-sm text-muted-foreground">
              {t("admin.users.showingRange", {
                from: (pagination.currentPage - 1) * ITEMS_PER_PAGE + 1,
                to: Math.min(pagination.currentPage * ITEMS_PER_PAGE, pagination.totalCount),
                total: pagination.totalCount,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                <ChevronLeft />
                {t("common.previous")}
              </Button>
              <div className="text-sm text-muted-foreground">
                {t("admin.users.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                {t("common.next")}
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
