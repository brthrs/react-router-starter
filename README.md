# React Router Starter

An opinionated full-stack starter built on React Router v7 with SSR, Prisma, Better Auth, and a production-ready tech stack targeting Scaleway Kubernetes.

For the full tech stack rationale see [docs/stack.md](docs/stack.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Router v7 (SSR) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database ORM | Prisma + PostgreSQL + pgvector |
| Auth | Better Auth (+ 2FA) |
| State | Zustand |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| i18n | react-i18next |
| Queues | BullMQ + Redis |
| AI / LLM | OpenAI SDK (GreenPT / EURouter) |
| Error tracking | Sentry |
| Testing | Vitest + Playwright |
| Build | Vite |

## Prerequisites

- **Node.js** — install via [asdf](https://asdf-vm.com/) using the pinned version in `.tool-versions`
- **PostgreSQL** — local instance or `npm run docker:dev` (see below)
- **Redis** — local instance or `npm run docker:dev`
- **Docker** — required for `docker:dev` and production container builds

## Quick Start

```bash
git clone <repo-url>
cd react-router-starter

# Install deps, copy .env, generate Prisma client, install Playwright browsers, init Husky
npm run setup

# Fill in your secrets
# At minimum: BETTER_AUTH_SECRET, OPENAI_API_KEY, OPENAI_BASE_URL, SENTRY_DSN
vi .env

# Start backing services (postgres + redis) via Docker
npm run docker:dev

# Run database migrations
npm run db:migrate

# Start the dev server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Scripts

| Script | Description |
|---|---|
| `npm run setup` | First-time setup: install, copy `.env`, Prisma generate, Playwright browsers, Husky |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:deploy` | Run Prisma migrations (production) |
| `npm run db:push` | Push schema changes without migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:create-user` | Create a user via script |
| `npm run docker:dev` | Start postgres + redis via Docker Compose |
