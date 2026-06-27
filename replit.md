# Campus Skill Share

A campus-exclusive web platform where university students advertise skills they offer and discover peer skills. Students can post skill ads, browse a feed, chat in real-time, and admins can moderate content.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/campus-skill-share run dev` — run the frontend (port 21549)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (artifacts/campus-skill-share)
- API: Express 5 (artifacts/api-server)
- Auth: Replit Auth (OIDC + PKCE) via openid-client v6
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/auth.ts` — sessions + users table (with role + displayName)
- `lib/db/src/schema/posts.ts` — skill posts table
- `lib/db/src/schema/messages.ts` — messages table
- `artifacts/api-server/src/routes/` — all API routes
- `artifacts/api-server/src/lib/auth.ts` — session management + OIDC
- `artifacts/api-server/src/middlewares/authMiddleware.ts` — extends req.user with AppUser (includes role + displayName)
- `lib/replit-auth-web/` — useAuth() hook for the frontend

## Architecture decisions

- Extended the Replit Auth user model with `role` (student/admin) and `displayName` stored in our own `users` table. The session stores the full AppUser so role checks don't require a DB query per request.
- Admin role is set manually via SQL: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`
- Real-time chat is implemented via 3-second polling on the conversation endpoint (no Socket.IO needed for MVP).
- Seed data (5 users + 8 posts) is pre-loaded so the feed isn't empty on first load.
- All categories are enforced as a PostgreSQL enum: Tutoring, Design, Music, Tech, Language, Other.

## Product

- **Landing page** (`/`) — public, explains the platform, Sign In button
- **Skill feed** (`/feed`) — authenticated, grid of posts with search + category filter
- **Post a skill** (`/post/new`) — authenticated, form to create a skill ad
- **Post detail** (`/post/:id`) — authenticated, full post + Start Chat button
- **Chat** (`/chat/:userId`) — authenticated, real-time message thread (3s polling)
- **Admin dashboard** (`/admin`) — admin only, all posts table with delete + platform stats
- **Profile** (`/profile`) — update display name

## User preferences

- Do not implement local authentication (bcrypt/JWT) — use Replit Auth

## Gotchas

- After any schema change: run `pnpm --filter @workspace/db run push`
- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen`
- The `??` and `||` operators cannot be mixed without parentheses in strict TS. Use the `resolveDisplayName()` helper in `api-server/src/lib/displayName.ts`.
- Admin access: manually set `role = 'admin'` in the DB after first login.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `replit-auth` skill for auth flow details
