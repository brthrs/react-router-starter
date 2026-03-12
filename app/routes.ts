import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("/login", "routes/login.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("/register", "routes/register.tsx"),
  route("/forgot-password", "routes/forgot-password.tsx"),
  route("/reset-password", "routes/reset-password.tsx"),
  route("/verify-email", "routes/verify-email.tsx"),
  route("/two-factor", "routes/two-factor.tsx"),
  route("/setup-2fa", "routes/setup-2fa.tsx"),
  route("/profile", "routes/profile.tsx"),
  route("/accept-invite", "routes/accept-invite.tsx"),
  route("/api/hello", "routes/api/hello.ts"),
  route("/api/upload-avatar", "routes/api/upload-avatar.ts"),
  route("/api/auth/*", "routes/api/auth.$.ts"),
  layout("routes/admin/_layout.tsx", [
    route("/admin", "routes/admin/dashboard.tsx"),
    route("/admin/users", "routes/admin/users/index.tsx"),
    route("/admin/users/new", "routes/admin/users/new.tsx"),
    route("/admin/users/:id", "routes/admin/users/$id.tsx"),
  ]),
] satisfies RouteConfig;
