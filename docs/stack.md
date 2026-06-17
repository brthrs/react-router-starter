# Proposed Tech Stack

## Core Language & Tooling

- **TypeScript** — strict mode enabled
- **asdf** — runtime version manager
- **ESLint** — linting
- **Git** — version control _(provider tbd)_

## Backend & Frontend

- **React Router** — routing (frontend & server-side)
- **shadcn/ui + Radix UI + Tailwind CSS** — component library & styling
- **Zustand** — state management
- **TanStack Query** — async data fetching & caching
- **React Hook Form + Zod** — form handling & schema validation
- **react-i18next** — internationalization
- **React Native** — mobile development
- **Prisma** — ORM
- **BullMQ** — queue processing & background jobs

## API

- **tRPC or RESTful** — API layer _(decision pending)_
- **API documentation** — _(provider tbd)_

## Data & Storage

- **Scaleway Managed PostgreSQL + pgvector** — relational database with vector search
- **Scaleway Managed Redis** — caching, background jobs & queues
- **Scaleway S3** — object storage

## AI & LLM

- **GreenPT / EURouter** — AI model provider routing
- **LangGraph** — complex orchestration _(under consideration)_
- **Evals** — _(framework tbd)_

## Auth & Security

- **Better Auth + 2FA** — authentication
- **Audit logging** — _(provider tbd)_

## Infrastructure & DevOps

- **Scaleway Managed Kubernetes** — hosting
- **Devtron** — Kubernetes management & DevOps
- **Vite** — build tooling
- **CI/CD pipeline** — _(tbd)_

## Observability

- **Sentry** — error tracking
- **Scaleway Cockpit** — logging, monitoring & observability
- **PostHog** — product analytics

## Testing

- **Vitest** — unit & integration testing
- **Playwright** — end-to-end testing

## Developer Experience

- **Cursor / Claude Code** — AI-assisted coding
- **Opinionated starter project** — enforced architecture _(coming soon)_
- **Scaleway TEM** — transactional email
