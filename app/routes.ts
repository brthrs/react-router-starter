import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("/login", "routes/login.tsx"),
  route("/logout", "routes/logout.tsx"),
  layout("routes/admin.tsx", [
    route("/admin", "routes/admin.dashboard.tsx"),
    route("/admin/users", "routes/admin.users.tsx"),
    route("/admin/users/new", "routes/admin.users.new.tsx"),
    route("/admin/users/:id", "routes/admin.users.$id.tsx"),
    route("/admin/activity", "routes/admin.activity.tsx"),
  ]),
] satisfies RouteConfig;
