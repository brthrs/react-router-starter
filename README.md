# React Router Starter

Admin panel starter built with React Router v7, Better Auth, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** [React Router v7](https://reactrouter.com/) (SSR)
- **Auth:** [Better Auth](https://better-auth.com/) (email/password)
- **Database:** PostgreSQL via [Prisma](https://www.prisma.io/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Runtime:** Node.js

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env` and update the values:

```bash
cp .env .env.local
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/react_router_starter"
BETTER_AUTH_SECRET="<generate with: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:5173"
```

### 3. Set up the database

```bash
# Create the database (if it doesn't exist)
createdb react_router_starter

# Run migrations
npm run db:migrate

# Generate the Prisma client
npm run db:generate
```

### 4. Create your first user

```bash
npm run db:create-user admin@example.com yourpassword "Admin User"
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run typecheck` | Run type generation and type checking |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:push` | Push schema changes without migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:create-user` | Create a user from the CLI |

## Project Structure

```
app/
├── components/
│   ├── admin-layout.tsx        # Sidebar layout for admin pages
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── auth.server.ts          # Better Auth instance + helpers
│   ├── auth-client.ts          # Better Auth client (React)
│   ├── activity-log.server.ts  # Activity logging utility
│   ├── db.server.ts            # Prisma client singleton
│   └── utils.ts                # General utilities
├── routes/
│   ├── api.auth.$.ts           # Better Auth API handler
│   ├── api.hello.ts            # Example API route
│   ├── login.tsx               # Login page
│   ├── logout.tsx              # Logout action
│   ├── index.tsx               # Root redirect
│   ├── admin.tsx               # Admin layout (auth gate)
│   ├── admin.dashboard.tsx     # Dashboard
│   ├── admin.users.tsx         # User list
│   ├── admin.users.new.tsx     # Create user
│   ├── admin.users.$id.tsx     # Edit/delete user
│   └── admin.activity.tsx      # Activity log
├── routes.ts                   # Route configuration
└── root.tsx                    # Root layout
prisma/
├── schema.prisma               # Database schema
└── migrations/                 # Migration history
```

## Authentication

Authentication is handled by [Better Auth](https://better-auth.com/) with email/password.

- **Server-side:** Use `requireAuth(request)` in loaders/actions to gate routes. Returns the full session object.
- **Client-side:** Use `authClient` from `~/lib/auth-client` for sign-in, sign-out, and session hooks.
- **API route:** Better Auth is mounted at `/api/auth/*` and handles all auth endpoints automatically.

## Deployment

Build and start the production server:

```bash
npm run build
npm start
```

Make sure `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` are set in your production environment. Run `npm run db:migrate:deploy` to apply migrations before starting.
