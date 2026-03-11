# CLAUDE.md

This file is the authoritative ruleset for working in this repository. Follow every rule. Do not substitute libraries, invent patterns, or deviate from conventions unless explicitly told to by the developer.

## Mandatory Tech Stack

These are the approved libraries. Do NOT replace any of them with an alternative unless given an extremely compelling justification **and** explicit developer approval.

| Concern | Library | Forbidden alternatives |
|---|---|---|
| Framework / Routing | React Router v7 | Next.js, Remix (standalone), TanStack Router |
| UI Components | Shadcn/ui + Radix UI | Material UI, Ant Design, Chakra UI |
| Styling | Tailwind CSS v4 | CSS modules, styled-components, Emotion |
| Forms | React Hook Form + `@hookform/resolvers` | Formik, manual `useState` per field |
| Validation | Zod | Yup, Joi, manual `if` checks |
| Auth | Better Auth | NextAuth, Lucia, Clerk, Auth0 |
| ORM | Prisma with `@prisma/adapter-pg` | Drizzle, TypeORM, Knex, raw SQL |
| State management | Zustand | Redux, Jotai, Valtio, MobX |
| Async data fetching | TanStack Query | SWR, raw `fetch` + `useEffect` |
| i18n | react-i18next | next-intl, FormatJS |
| Queue / Background jobs | BullMQ + Redis | Agenda, node-cron, `setTimeout`/`setInterval` |
| Logging | Pino | Winston, Bunyan, `console.log` |
| Error tracking | Sentry | Bugsnag, Datadog RUM |
| Toasts | Sonner | react-hot-toast, react-toastify |
| Email | Nodemailer | SendGrid SDK, Resend SDK |
| Object storage | AWS S3 SDK (or local filesystem fallback) | — |
| Testing | Vitest (unit), Playwright (e2e) | Jest, Cypress |

### Anti-pattern enforcement

Do NOT implement things manually that the stack already covers:

- Use **TanStack Query** instead of raw `fetch` + `useEffect` for client-side data fetching.
- Use **React Hook Form** instead of manual `useState` per field.
- Use **Zod schemas** instead of hand-written validation logic.
- Use **`authClient`** / **`auth.api`** instead of rolling custom auth flows.
- Use **BullMQ** instead of `setTimeout` / `setInterval` for background work.
- Use **Sonner** (`toast()`) instead of `window.alert()` or custom toast implementations.
- Use **Prisma** instead of raw SQL queries.

## Project Structure

```
app/
├── components/           # Shared UI components
│   ├── ui/               # Shadcn primitives (button, input, card, etc.)
│   ├── layouts/          # Layout components (admin-layout, etc.)
│   └── <feature>/        # Feature-specific components grouped in subfolders
├── lib/                  # Utilities and server-only modules
│   ├── auth/             # Better Auth (server.ts + client.ts)
│   ├── locales/          # i18n translation objects (en.ts, nl.ts, ...)
│   ├── *.server.ts       # Server-only modules (db, email, storage, queue, worker, logger)
│   ├── utils.ts          # cn() helper
│   └── i18n.ts           # i18next initialization
├── routes/               # Route modules
│   ├── api/              # API-only routes (.ts, no UI)
│   └── admin/            # Admin section with _layout.tsx + nested routes
├── services/             # Domain/business logic (*.server.ts)
├── stores/               # Zustand stores
├── root.tsx              # Root layout, providers, global error boundary
├── routes.ts             # Route registration (EVERY route must be listed here)
├── app.css               # Tailwind theme and global styles
└── entry.client.tsx / entry.server.tsx
scripts/                  # CLI scripts (create-user, worker)
prisma/                   # Schema and migrations
```

### Naming conventions

- **Server-only files**: use `.server.ts` suffix — they are excluded from the client bundle.
- **Route files**: `.tsx` for pages with UI, `.ts` for API-only routes.
- **Components**: PascalCase filenames and exports (e.g. `RouteErrorBoundary`, `AccountInfo`).
- **Stores**: camelCase filenames (e.g. `theme.ts`), hooks named `use<Name>Store`.
- **Services**: `<domain>.server.ts` (e.g. `user.server.ts`, `invite.server.ts`).

### When to create subfolders

- **`app/lib/`**: Group related files when you have 2+ files for the same concern (e.g. `auth/server.ts` + `auth/client.ts`).
- **`app/routes/`**: Group into a subfolder with `_layout.tsx` when you have 3+ routes sharing a URL prefix (e.g. `admin/users/`).
- **`app/components/`**: Group into a feature subfolder when you have 3+ components for the same feature (e.g. `components/profile/`).

## Route File Conventions

### Import order

Maintain this exact order, separated by blank lines where grouping changes:

1. `react-router` imports
2. `react` imports
3. Third-party libraries (`lucide-react`, `react-i18next`, `sonner`, etc.)
4. Form/validation (`react-hook-form`, `zod`, `@hookform/resolvers/zod`)
5. Route types: `import type { Route } from "./+types/<route-name>"`
6. Lib imports: `~/lib/...`
7. Service imports: `~/services/...`
8. Component imports: `~/components/...`

### Exports

- **Named exports**: `loader`, `action`, `meta`, `ErrorBoundary`
- **Default export**: the page component

```typescript
import type { Route } from "./+types/example";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Page Title" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // ...
  return { /* data */ };
}

export async function action({ request }: Route.ActionArgs) {
  // ...
}

export default function ExamplePage() {
  // ...
}

export { RouteErrorBoundary as ErrorBoundary } from "~/components/route-error-boundary";
```

### Route registration

Every new route MUST be added to `app/routes.ts`. Use `layout()` for nested groups with shared layout. Dynamic segments use `:param` in the path and `$param.tsx` for the filename.

### Type imports

Always use the generated route types:

```typescript
import type { Route } from "./+types/<route-name>";
```

Use `Route.LoaderArgs`, `Route.ActionArgs`, `Route.MetaArgs`, `Route.ComponentProps` from these types.

## Form Patterns

### Client-side forms (auth flows, client-only actions)

Use `useForm` + `zodResolver` + `authClient`:

```typescript
const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

// Inside component:
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<FormValues>({ resolver: zodResolver(schema) });
```

### Server-side forms (CRUD operations)

Use `<Form method="post">` with Zod validation in the action:

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // ... do work with result.data
  return redirect("/success");
}
```

Consume with `useActionData<typeof action>()` and `useNavigation()` for `isSubmitting`.

### Error and success display

- Field errors: `<p className="text-sm text-destructive">{error}</p>`
- Error boxes: `<div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">`
- Success boxes: `<div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3">`

## Auth Patterns

- **Protected routes**: call `requireAuth(request)` in the loader. Redirects to `/login` if unauthenticated.
- **Admin routes**: call `requireAdmin(request)` in the loader. Returns 403 if not admin.
- **Optional auth**: call `getUser(request)` — returns the user or `null`.
- **Client-side auth actions**: use `authClient` from `~/lib/auth/client` (sign-in, sign-out, password reset, etc.).
- **API routes**: call `requireAuth(request)` in the action.

All auth helpers live in `~/lib/auth/server`. Do NOT re-implement session checking or auth logic.

## TypeScript Rules

- **NEVER** use `any`. Use `unknown`, a specific type, or a generic instead. ESLint enforces this.
- Prefer `interface` over `type` for object shapes.
- Use template literals (`${variable}`) instead of string concatenation.
- Derive form types from Zod schemas: `type FormValues = z.infer<typeof schema>`.
- Use `satisfies` where appropriate (e.g. `satisfies RouteConfig` in `routes.ts`).
- Path alias: always use `~/` for imports from `app/` (e.g. `~/lib/db.server`, `~/components/ui/button`).
- Use `import type` for type-only imports.

## Styling Rules

- **ALWAYS** use Tailwind CSS for styling. No inline `style` attributes, no CSS modules, no styled-components.
- **ALWAYS** check for existing Shadcn components before building custom UI (`~/components/ui/`).
- Use `cn()` from `~/lib/utils` for conditional/merged class names.
- Dark mode is handled via the `.dark` class on `<html>`. Use Tailwind's `dark:` variants.
- CSS variables are defined in `app/app.css` — use them via Tailwind's semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-input`, `bg-destructive`, etc.).

## i18n Rules (MANDATORY)

- **NEVER** hardcode user-facing strings. All labels, messages, placeholders, error text, success text, page titles, and button text MUST use `useTranslation()` and `t("key")`.
- Translation files live in `app/lib/locales/` (one file per language: `en.ts`, `nl.ts`, etc.).
- When adding new features, add translation keys to **ALL** existing locale files.
- Use nested key structure matching the feature: `admin.users.title`, `auth.login.subtitle`, `common.save`.
- Shared/reusable keys go under `common.*`.

## Validation Rules (MANDATORY)

- **NEVER** write validation logic by hand (e.g. `if (!email.includes("@"))`, `if (name.length < 1)`).
- **ALWAYS** use Zod schemas for all validation, both client-side and server-side.
- Define schemas at module level: `const schema = z.object({ ... })`.
- Derive TypeScript types from schemas: `type FormValues = z.infer<typeof schema>`.
- Server actions: `schema.safeParse()` → return `{ errors: result.error.flatten().fieldErrors }` on failure.
- Client forms: pass `zodResolver(schema)` to `useForm`.

## Services Layer and Refactoring Rules

- Business/domain logic belongs in `app/services/*.server.ts`.
- Services interact with Prisma and the auth API. Route loaders/actions call services — they do NOT import Prisma directly.
- **When to extract a service**: if a loader or action contains more than simple data fetching or a single Prisma call, extract the logic into a service file.
- **When to split a service**: if a service file grows beyond ~200 lines or handles unrelated concerns, split it into separate files.
- Keep route files focused on request/response handling, form parsing, and rendering. Push logic down to services.

## Core Principles

- **NEVER** create documentation files unless explicitly asked.
- **NEVER** write tests unless explicitly asked.
- **NEVER** create git commits automatically.
- **NEVER** use Docker unless specifically asked.
- Before installing a new package, check `package.json` for an existing dependency that covers the need.
- Before creating a new component, check `app/components/` for something reusable.
- Look at similar existing pages/components and match their patterns exactly.

## Verification (run after every change)

```bash
npm run build       # Must pass — catches type errors and build issues
npm run lint        # Must pass with zero warnings
```

### After specific changes

- **Prisma schema changed**: run `npx prisma migrate dev` then `npx prisma generate`.
- **New route created**: add it to `app/routes.ts`.
- **New translation keys added**: verify they exist in ALL locale files.

## Git Workflow (when asked to commit)

- Review the diff before writing a commit message.
- Check `git log --oneline -n 10` and match the existing commit message style.
- If changes span multiple unrelated concerns, split into separate atomic commits.
- Follow conventional commit format if established in the repository.
